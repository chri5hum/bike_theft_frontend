import pandas as pd
import psycopg2
import sys
import os

# query = "SELECT * FROM prod.fact_bike AS x LEFT JOIN prod.dim_manufacturer AS d_m ON x.manufacturer_key = d_m.id LEFT JOIN prod.dim_location AS d_l ON x.location_key = d_l.id LEFT JOIN prod.dim_date AS d_d ON x.date_key = d_d.id;"
query = "SELECT * FROM prod.fact_bike AS x LEFT JOIN prod.dim_manufacturer AS d_m ON x.manufacturer_key = d_m.id LEFT JOIN prod.dim_location AS d_l ON x.location_key = d_l.id LEFT JOIN prod.dim_date AS d_d ON x.date_key = d_d.id WHERE d_l.lat NOT IN ('NaN');"

# nothing = 'nothing'
# param_dic = {
#     "host"      : nothing,
#     "database"  : nothing,
#     "user"      : nothing,
#     "password"  : nothing
# }

param_dic = {
    "host"      : os.environ['GCP_VM_IP'],
    "database"  : os.environ['GCP_VM_DB'],
    "user"      : os.environ['GCP_VM_USER'],
    "password"  : os.environ['GCP_VM_PASS']
}

def connect(params_dic):
    """ Connect to the PostgreSQL database server """
    conn = None
    try:
        # connect to the PostgreSQL server
        print('Connecting to the PostgreSQL database...')
        conn = psycopg2.connect(**params_dic)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
    print("Connection successful")
    return conn

def postgresql_to_dataframe(conn, select_query, column_names):
    """
    Tranform a SELECT query into a pandas dataframe
    """
    cursor = conn.cursor()
    try:
        cursor.execute(select_query)
    except (Exception, psycopg2.DatabaseError) as error:
        print("Error: %s" % error)
        cursor.close()
        return 1
    
    # Naturally we get a list of tupples
    tupples = cursor.fetchall()
    cursor.close()
    
    # We just need to turn it into a pandas dataframe
    df = pd.DataFrame(tupples, columns=column_names)
    return df

def getEverything():
    try:
        conn = connect(param_dic)
        fact_columns = ["event_id", "title", "manufacturer_key", "location_key", "date_key", "model", "occurred_at"]
        manufacturer_columns = ["manufacturer_id", "manufacturer_name", "manufacturer_company_url", "manufacturer_frame_maker", "manufacturer_description", "manufacturer_short_name", "manufacturer_slug"]
        location_columns = ["location_id", "postal", "city", "country", "lat", "long"]
        date_columns = ["date_id", "date", "date_us_format", "date_us_short_format", "date_iso_format", "num_year", "num_month_in_year", "num_week_in_year", "num_week_in_month", "num_day_in_year", "num_day_in_month", "num_day_in_week", "name_month_en", "name_month_abbreviated_en", "name_day_en", "name_day_abbreviated_en"]
        # Execute the "SELECT" query
        column_names = fact_columns + manufacturer_columns + location_columns + date_columns
        df = postgresql_to_dataframe(conn, query, column_names)
        conn.close()
    except:
        df = pd.read_csv('./static/data/output.csv')
    return df