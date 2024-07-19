from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
import requests
from datetime import datetime

from constants import WEATHER_API_KEY

WEATHER_API_KEY = WEATHER_API_KEY


weather_bp = Blueprint('weather', __name__)

@weather_bp.route("/getWeather", methods = ['POST'])
@jwt_required()
def getWeather():
    data = request.get_json()
    city = '+'.join(data.get('city').split())
    url = f'http://api.openweathermap.org/data/2.5/weather?q={city}&units=imperial&appid={WEATHER_API_KEY}'
    try:
        response = requests.get(url).json()

        timezone_offset = response['timezone']
        local_time = datetime.utcfromtimestamp(response['dt'] + timezone_offset).strftime('%Y-%m-%d %H:%M:%S')
        sunrise_time = datetime.utcfromtimestamp(response['sys']['sunrise'] + timezone_offset).strftime('%H:%M:%S')
        sunset_time = datetime.utcfromtimestamp(response['sys']['sunset'] + timezone_offset).strftime('%H:%M:%S')

        city_weather = {
            'city': response['name'],
            'coordinates': f"Lat: {response['coord']['lat']}, Lon: {response['coord']['lon']}",
            'temperature': f"{response['main']['temp']} °F",
            'feels_like': f"{response['main']['feels_like']} °F",
            'temp_min': f"{response['main']['temp_min']} °F",
            'temp_max': f"{response['main']['temp_max']} °F",
            'pressure': f"{response['main']['pressure']} hPa",
            'humidity': f"{response['main']['humidity']} %",
            'visibility': f"{response['visibility']} meters",
            'wind_speed': f"{response['wind']['speed']} mph",
            'wind_degree': f"{response['wind']['deg']}°",
            'weather': response['weather'][0]['description'],
            'icon': f"http://openweathermap.org/img/w/{response['weather'][0]['icon']}.png",
            'local_time': local_time,
            'sunrise': sunrise_time,
            'sunset': sunset_time,
        }
        return jsonify({'message': 'Successfully calculated the result', 'weather': city_weather}), 200
    except Exception as e:
        return jsonify({'message': f'Failed to fetch weather information: {e}'}), 400