import random
import string
import boto3
from botocore.exceptions import NoCredentialsError
from PIL import Image
import io
from flask import send_file
import google.generativeai as genai
from constants import GOOGLE_API_KEY

genai.configure(api_key=GOOGLE_API_KEY)

model = genai.GenerativeModel('gemini-pro')

def generate_random_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase, k=length))

def get_s3_client(AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_REGION):
    s3 = boto3.client('s3', 
                  aws_access_key_id=AWS_ACCESS_KEY,
                  aws_secret_access_key=AWS_SECRET_KEY,
                  region_name=AWS_REGION)
    return s3

def upload_file_to_s3(s3, image_data, bucket_name, object_name):
    try:
        s3.put_object(Bucket=bucket_name, Key=object_name, Body=image_data, ContentType='image/jpeg')
        url = f"https://{bucket_name}.s3.amazonaws.com/{object_name}"
        return url
    except FileNotFoundError:
        print("The file was not found")
    except NoCredentialsError:
        print("Credentials not available")

def get_file_from_s3(s3, bucket_name, object_name):
    try:
        response = s3.get_object(Bucket=bucket_name, Key=object_name)
        image_data = response['Body'].read()
        return image_data
    except Exception as e:
        print(f"Error getting file from S3 :{e}")
    
def delete_file_from_s3(s3, bucket_name, object_name):
    try:
        response = s3.delete_object(Bucket=bucket_name, Key=object_name)
        return response
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'NoSuchKey':
            print(f"File not found: {object_name}")
        else:
            print(f"Error deleting file from S3: {e}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return None

def beautifyContent(text):
    question = f"I am posting a photo on a social media platform. This is my caption: '{text}'. Fix grammatical and sytactical errors and beautify it and return within 300 characters. Also add couple of hashtags"
    response = model.generate_content(question)
    return response.text
