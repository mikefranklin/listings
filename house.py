from flask import Flask, render_template
from flask.ext.pymongo import PyMongo
import os
import csv
import json
from datetime import datetime

app = Flask(__name__)
mongo = PyMongo(app)


@app.route('/')
def hello_world():
    return 'Hello World!'


@app.route("/listings")
def show_listings():
    """ show listings """

    return render_template("index.html")


@app.route('/import')
def import_redfin():
    """
    load & save the latest redfin CSV
    """

    listings, filedate = load_latest_listings()
    res = save_listings(listings, filedate)
    return json.dumps(res)


def save_listings(listings, date):
    """ update house info """

    bulk = mongo.db.listings.initialize_unordered_bulk_op()

    for listing in listings:
        if "listing id" in listing:
            listing["_id"] = listing.pop("listing id")
            listing["last_loaded"] = date
            bulk.find({"_id": listing["_id"]}).upsert().update({"$set": listing})

    return bulk.execute()


def load_latest_listings():
    " find & import the latest redfin csv file as a dict & date "
    # redfin_2015-11-12-14-27-48_results

    dir = "/Users/michaelfranklin/Downloads"
    files = [file for file in os.listdir(dir)
             if file.startswith("redfin") and file.endswith("results.csv")]
    file = sorted(files)[-1]
    date = datetime.strptime(file[7:-12], "%Y-%m-%d-%H-%M-%S")

    with open("{}/{}".format(dir, file)) as csvfile:
        reader = csv.reader(csvfile)
        raw = next(reader)
        titles = ["url" if title.startswith("URL ") else title.lower()
                  for title in raw]
        data = [dict(zip(titles, row)) for row in reader]

    return (data, date)


if __name__ == '__main__':
    app.run(debug=True)
