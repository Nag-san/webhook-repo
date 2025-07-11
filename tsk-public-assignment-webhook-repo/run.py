import sys
print("PYTHON:", sys.executable)
print("PATHS:", sys.path)

from app import create_app

app = create_app()


if __name__ == '__main__': 
    app.run(debug=True)
