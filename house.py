from flask import Flask
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


@app.route('/import')
def import_redfin():
    """
    load & save the latest redfin CSV
    """

    listings = load_latest_listings()
    res = save_listings(listings)
    return json.dumps(res)


def save_listings(listings):
    """ update house info """

    bulk = mongo.db.listings.initialize_unordered_bulk_op()
    now = datetime.now()

    for listing in listings:
        if "listing id" in listing:
            listing["_id"] = listing.pop("listing id")
            listing["last_loaded"] = now
            bulk.find({"_id": listing["_id"]}).upsert().update({"$set": listing})

    return bulk.execute()


def load_latest_listings():
    " find & import the latest redfin csv file as a dict "

    dir = "/Users/michaelfranklin/Downloads"
    files = [file for file in os.listdir(dir)
             if file.startswith("redfin") and file.endswith("results.csv")]

    file = "{}/{}".format(dir, sorted(files)[-1])

    with open(file) as csvfile:
        reader = csv.reader(csvfile)
        raw = next(reader)
        titles = ["url" if title.startswith("URL ") else title.lower()
                  for title in raw]
        data = [dict(zip(titles, row)) for row in reader]

    return data


if __name__ == '__main__':
    app.run(debug=True)
