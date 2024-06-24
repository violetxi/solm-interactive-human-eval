import os
import json
import pandas as pd
from google.cloud import firestore
from google.api_core.datetime_helpers import DatetimeWithNanoseconds


os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'authen_keys/solm-human-eval-b3bfb-firebase-adminsdk-gdmth-9f91bf5eb2.json'
db = firestore.Client()



def get_all_collections():
    collections = db.collections()
    collection_names = [collection.id for collection in collections]
    return collection_names


def download_data_from_collection(collection_name):
    collection_ref = db.collection(collection_name)
    docs = collection_ref.stream()

    data = []
    for doc in docs:        
        doc_dict = doc.to_dict()
        doc_dict = convert_timestamps(doc_dict)
        data.append(doc_dict)

    return data




def convert_timestamps(data):    
    for key, value in data.items():
        if isinstance(value, DatetimeWithNanoseconds):
            data[key] = value.isoformat()
        elif isinstance(value, dict):
            data[key] = convert_timestamps(value)

    return data


if __name__ == '__main__':
    collection_names = get_all_collections()
    raw_data = {}

    for subject_id in collection_names:
        print(f"Downloading data from collection for subject: {subject_id}")
        data = download_data_from_collection(subject_id)        
        raw_data[subject_id] = data
        # save data to json for each subject
        with open(f'data/raw_data/{subject_id}.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)

    # save raw data to json file
    with open('data/raw_data.json', 'w', encoding='utf-8') as f:
        json.dump(raw_data, f, ensure_ascii=False, indent=4)

    print("Data downloaded successfully!")

