from flask import Flask, render_template
from flask.ext.pymongo import PyMongo
from bson import json_util
import os
import csv
import json
from datetime import datetime

app = Flask(__name__)
mongo = PyMongo(app)

entry = lambda index, text: {"redfin": text, "_id": index,
                             "_default": {"sequence": index, "text": text, "show": True,
                                          "fieldname": "field{}".format(index)}}


@app.route('/')
def hello_world():
    return 'Hello World!'


@app.route("/listings")
def show_listings():
    """ show listings """

    return render_template("index.html")


@app.route("/setup")
def setup():
    " use existing headers & setup basic header info"

    listings = list(mongo.db.listings.find())
    unique = sorted({key for listing in listings for key in listing.keys()})
    headers = [entry(index, text) for index, text in enumerate(unique)]

    mongo.db.headers.drop()
    for header in headers:
        mongo.db.headers.insert_one(header)

    return json.dumps(headers)


@app.route("/getalldata")
def get_data():
    " retrieve all listings, return header info + data"

    listings = list(mongo.db.listings.find())
    headers = update_and_retrieve_headers(listings)
    merge_listings_with_headers(listings, headers)

    return json.dumps({"data": headers}, default=json_util.default)


def merge_listings_with_headers(listings, headers):
    " add array of data to each header "

    # ? add encodings for listifyable data (e.g. city, location, realtor)

    for header in headers:
        header["data"] = [listing.get(header["redfin"]) for listing in listings]


def update_and_retrieve_headers(listings):
    "  get headers collection + update with any new listing-headers "

    headers = list(mongo.db.headers.find())  # headers in DB
    db_names = [header["redfin"] for header in headers]
    listing_names = {key for listing in listings for key in listing.keys()}

    missing = [header for header in listing_names if header not in db_names]

    if len(missing):
        index = max(header["_id"] for header in headers)
        for header in sorted(missing):
            index += 1
            mongo.db.headers.insert_one(entry(index, header))
            headers.append(entry(index, header))

    for header in headers:
        header.update(header.pop("_default"))  # should merge with user data, if any

    return headers


@app.route('/import')
def import_redfin():
    " load & save the latest redfin CSV "

    listings, filedate = load_latest_listings()
    res = save_listings(listings, filedate)
    return json.dumps(res)


def save_listings(listings, date):
    " update house info "

    bulk = mongo.db.listings.initialize_unordered_bulk_op()

    for listing in listings:
        if "listing id" in listing:
            listing["_id"] = listing.pop("listing id")
            listing["last_loaded"] = date
            bulk.find({"_id": listing["_id"]}).upsert().update({"$set": listing})

    return bulk.execute()


def load_latest_listings():
    " find & import the latest redfin csv file as a dict & date "

    dir = "/Users/michaelfranklin/Downloads"
    format = "redfin_%Y-%m-%d-%H-%M-%S_results.csv"

    files = [file for file in os.listdir(dir)
             if file.startswith("redfin") and file.endswith("results.csv")]
    file = sorted(files)[-1]
    date = datetime.strptime(file, format)

    with open("{}/{}".format(dir, file)) as csvfile:
        reader = csv.reader(csvfile)
        raw = next(reader)
        titles = ["url" if title.startswith("URL ") else title.lower()
                  for title in raw]
        data = [dict(zip(titles, row)) for row in reader]

    return (data, date)


if __name__ == '__main__':
    app.run(debug=True)