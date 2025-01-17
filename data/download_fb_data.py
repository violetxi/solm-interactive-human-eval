import warnings
import os
import json
import re
import pandas as pd
from google.cloud import firestore
from google.api_core.datetime_helpers import DatetimeWithNanoseconds


warnings.filterwarnings('ignore')

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'authen_keys/solm-human-eval-interactive-firebase-adminsdk-19csk-e5198070e1.json'
db = firestore.Client()

# Attention check questions and answers
ATTENTION_CHECK_QA = {
    "1 + 1 = 2": "True",
    "Mary was excited about her vacation, but had to cancel it due to work. Mary is likely to feel excited about this situation.": "False",
    "Please select 'False'": "False",
    "John believes vaccines are effective at preventing diseases. John is likely to support vaccination programs.": "True",
    "玛丽对她的假期感到兴奋，但由于工作不得不取消。玛丽对这种情况可能感到兴奋。": "False",
    "约翰认为疫苗在预防疾病方面是有效的。约翰可能会支持疫苗接种计划。": "True",
    "请选择‘错误’": "False",
}


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


def extract_within_quotes(text):
    matches = re.findall(r'[“"](.*?)[”"]', text)    
    return matches[0] if matches else None


if __name__ == '__main__':
    collection_names = get_all_collections()
    raw_data = {}
    collection_names = [name for name in collection_names if name != 'k']
    answer_map = {'True': 'sarcastic', 'False': 'not sarcastic', 'Ambiguous': 'ambiguous'}
    attention_check_str = "Please determine if the following statement is true or false"

    """ English Datasets """    
    # # iSarcasm 
    # current_data_prefix = 'Full-iSarcasm-1'
    # current_data_prefix = 'Full-iSarcasm-2'
    # current_data_prefix = 'Full-iSarcasm-3'
    # current_data_prefix = 'Full-iSarcasm-4'
    # current_data_prefix = 'Full-iSarcasm-5'
    # current_data_prefix = 'Full-iSarcasm-6'
    # current_data_prefix = 'Full-iSarcasm-7'
    # current_data_prefix = 'Full-iSarcasm-8'


    # CovidVaccineStance
    # current_data_prefix = 'Full-CovidVaccineStance-1'
    # current_data_prefix = 'Full-CovidVaccineStance-2'
    # current_data_prefix = 'Full-CovidVaccineStance-3'
    # current_data_prefix = 'Full-CovidVaccineStance-4'
    # current_data_prefix = 'Full-CovidVaccineStance-5' 
    # current_data_prefix = 'Full-CovidVaccineStance-6'
    # current_data_prefix = 'Full-CovidVaccineStance-7'

    # # GoEmotions    
    # current_data_prefix = 'Full-GoEmotions_Sentiment-1'
    # current_data_prefix = 'Full-GoEmotions_Sentiment-2'
    # current_data_prefix = 'Full-GoEmotions_Sentiment-3'
    # current_data_prefix = 'Full-GoEmotions_Sentiment-4'
    # current_data_prefix = 'Full-GoEmotions_Sentiment-5'
    # current_data_prefix = 'Full-GoEmotions_Sentiment-6'
    # current_data_prefix = 'Full-GoEmotions_Sentiment-7'
    # current_data_prefix = 'Full-GoEmotions_Sentiment-8'
    # current_data_prefix = 'Full-GoEmotions_Sentiment-9'

    # # Abortion
    # current_data_prefix = 'Full-SemT6_Abortion-1'
    # current_data_prefix = 'Full-SemT6_Abortion-2'
    # current_data_prefix = 'Full-SemT6_Abortion-3'
    # current_data_prefix = 'Full-SemT6_Abortion-4'
    # current_data_prefix = 'Full-SemT6_Abortion-5'
    # current_data_prefix = 'Full-SemT6_Abortion-6'
    # current_data_prefix = 'Full-SemT6_Abortion-7'
    # current_data_prefix = 'Full-SemT6_Abortion-8'

    # # Sentiment
    # current_data_prefix = 'Full-SemT6_Sentiment-1'
    # current_data_prefix = 'Full-SemT6_Sentiment-2'
    # current_data_prefix = 'Full-SemT6_Sentiment-3'
    # current_data_prefix = 'Full-SemT6_Sentiment-4'
    # current_data_prefix = 'Full-SemT6_Sentiment-5'
    # current_data_prefix = 'Full-SemT6_Sentiment-6'
    # current_data_prefix = 'Full-SemT6_Sentiment-7'
    # current_data_prefix = 'Full-SemT6_Sentiment-8'

    # # Politeness
    # current_data_prefix = 'Full-Politeness-1'
    # current_data_prefix = 'Full-Politeness-2'
    # current_data_prefix = 'Full-Politeness-3'
    # current_data_prefix = 'Full-Politeness-4'
    # current_data_prefix = 'Full-Politeness-5'
    # current_data_prefix = 'Full-Politeness-6'
    # current_data_prefix = 'Full-Politeness-7'
    # current_data_prefix = 'Full-Politeness-8'
    current_data_prefix = 'Full-Politeness-9'

    """ Chinese Datasets """
    # current_data_prefix = 'CSTANCE-ch-1'
    # current_data_prefix = 'Full-SIMS-ch-1'    

    attention_check_strs = list(ATTENTION_CHECK_QA.keys())    
    for subject_id in collection_names:        
        if subject_id != 'surveys' and subject_id.startswith(current_data_prefix):
            # print(f"Downloading data from collection for subject: {subject_id}")
            data = download_data_from_collection(subject_id)        
            raw_data[subject_id] = data
            # save data to pandas dataframe and redo index
            df = pd.DataFrame(data)
            # filter for attention check questions            
            attention_check_df = df[df['statement'].isin(attention_check_strs)]
            # check if all attention check questions are answered correctly
            attention_check_df['passed'] = attention_check_df['statement'].map(ATTENTION_CHECK_QA) == attention_check_df['response']
            # Only keep data if all attention check questions are answered correctly                        
            if len(attention_check_df) == 4 and len(df) == 24:
                if not attention_check_df.empty and attention_check_df['passed'].all():
                    df = df[~df['statement'].isin(attention_check_strs)]
                    df['Conversation'] = df['statement']
                    try:
                        if "in the conversation?" in df['question'].iloc[0]:
                            df['Statement'] = df['question'].map(lambda x: x.split('said "')[1].split('" in the conversation?')[0])
                        else:
                            df['Statement'] = df['question'].map(lambda x: x.split('said "')[1].split('" during')[0])
                    except Exception as e:                
                        df['Statement'] = df['question'].map(lambda x: extract_within_quotes(x))
                    df['Answer'] = df['response'] #.map(answer_map)
                    df.to_csv(f'data/subjects/{subject_id}.csv', index=False)
                else:
                    print(f"Subject {subject_id} failed attention check questions. Skipping")
            else:
                print(f"Subject {subject_id} did not complete all questions. Skipping")


    # save raw data to json file
    with open('data/raw_data.json', 'w', encoding='utf-8') as f:
        json.dump(raw_data, f, ensure_ascii=False, indent=4)

    print("Data downloaded successfully!")

