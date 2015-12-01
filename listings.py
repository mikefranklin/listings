from flask import Flask, render_template, request
from flask.ext.pymongo import PyMongo
from operator import itemgetter
from bson import json_util
import os
import csv
import json
from datetime import datetime

app = Flask(__name__)
mongo = PyMongo(app)

entry = lambda index, text: {"redfin": text, "_id": index,
                             "_default": {"sequence": index, "text": text,
                                          "show": True}}


@app.route('/')
def hello_world():
    return 'Hello World!'


@app.route("/savebrowserapi/<api>")
def save_browser_api(api):
    """ save the passed api to the database. """

    result = mongo.db.api.update({"_id": 0}, {"$set": {"_id": 0, "api": api}},
                                 upsert=True)

    return json.dumps(result)


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

    raw_listings = list(mongo.db.listings.find())
    headers = update_and_retrieve_headers(raw_listings)
    listings = condense_listings(raw_listings, headers)

    return json.dumps({"api": list(mongo.db.api.find())[0]["api"],
                       "headers": headers,
                       "keys": {h["redfin"]: h["_id"] for h in headers},
                       "listings": list(listings)},
                      default=json_util.default)


def condense_listings(raw_listings, headers):
    """ convert from name: value to array of values indexed by fieldId """

    maxId = max(header["_id"] for header in headers) + 1
    for listing in raw_listings:
        entry = [""] * maxId
        for header in headers:
            entry[header["_id"]] = listing.get(header["redfin"], "")
        yield(entry)


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

    return sorted(headers, key=itemgetter("sequence"))


# var data = {id: id, fieldname: fieldname, value: value}
# retryAjax(JSON.stringify(data), {api: "savelistingdata", type: "post"})
@app.route("/savelistingdata", methods=["PUT", "POST"])
def save_listing_data():
    data = request.get_json(force=True)
    res = mongo.db.listings.update({"_id": data["id"]},
                                   {"$set": {data["headername"]: data["value"]}})
    return json.dumps(list(res))


@app.route("/saveheadervalue", methods=["PUT", "POST"])
def save_header_value():
    data = request.get_json(force=True)  # fieldname, data=[[_id, value]...
    update = lambda value: {"_default." + data["redfin"]: value}

    bulk = mongo.db.headers.initialize_unordered_bulk_op()
    for _id, value in data["data"]:
        bulk.find({'_id': _id}).update({'$set': update(value)})

    return json.dumps(bulk.execute())


@app.route("/savenewfield", methods=["PUT", "POST"])
def save_new_field():
    data = request.get_json(force=True)
    field = {"_id": data.pop("_id"), "redfin": data.pop("redfin"), "_default": data}

    res = mongo.db.headers.insert_one(field)

    return json.dumps([list(res), field])


@app.route("/saveheader", methods=["PUT", "POST"])
def save_header():
    data = request.get_json(force=True)
    field = {"_id": data.pop("_id"), "redfin": data.pop("redfin"), "_default": data}

    res = mongo.db.headers.update({"_id": field["_id"]}, {"$set": field})

    return json.dumps(list(res))


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
