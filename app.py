from flask import Flask
from flask import render_template
from from_db import getEverything

# param_dic = {
#     "host"      : "localhost",
#     "database"  : "test",
#     "user"      : "postgres",
#     "password"  : "admin"
# }

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("data.html")

@app.route("/data")
def get_fact_bikes():
    df = getEverything()
    return df.to_json(orient='records')

if __name__ == "__main__":
    app.run()


