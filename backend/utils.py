import random
import string

def generate_random_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase, k=length))