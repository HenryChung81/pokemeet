from sqlalchemy import create_engine, text


# MySQLへの接続先
DATABASE_URL = "mysql+pymysql://root@localhost/pokemeet"


# DB接続用のエンジンを作成
engine = create_engine(DATABASE_URL)


# MySQLへ接続する
with engine.connect() as connection:

    # usersテーブルの全データを取得する
    result = connection.execute(
        text("SELECT * FROM users")
    )

    # 取得したデータを1行ずつ表示する
    for row in result:
        print(row)