from sqlalchemy import create_engine


# MySQLへの接続先
DATABASE_URL = "mysql+pymysql://root@localhost/pokemeet"


# DB接続用のエンジンを作成
engine = create_engine(DATABASE_URL)