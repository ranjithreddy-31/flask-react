from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from bs4 import BeautifulSoup
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer
import nltk
import requests

scraper_bp = Blueprint('scraper', __name__)

def summarize(content):
    parser = PlaintextParser.from_string(content, Tokenizer("english"))
    summarizer = LsaSummarizer()
    summary = summarizer(parser.document, sentences_count=3)  
    summary_text = ' '.join(str(sentence) for sentence in summary)
    return summary_text
    
def scrape_data(url):
    response = requests.get(url)
    if response.status_code == 200:
        soup = BeautifulSoup(response.content, 'html.parser')
        paragraphs = soup.find_all('p')
        data = [paragraph.text for paragraph in paragraphs]
        full_text = ' '.join(data)
        return jsonify({'summary': full_text}), 200
    else:
        return jsonify({'message': 'Failed to retrieve data'}), 404

@scraper_bp.route("/getData", methods=["POST"])
@jwt_required()
def get_data_from_url():
    url = request.get_json().get("url")
    return scrape_data(url)