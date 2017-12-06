import json
import pickle
import urllib
from flask import Flask, render_template, request, make_response, send_from_directory
from flask_cors import CORS, cross_origin
from omer_zaks import omer_zaks

from drawing_graph import Graph, get_random_id
from drawing_graph import User

app = Flask(__name__)
CORS(app)

def create_cookie(user_id="", user_name = "", mail = ""):
    return urllib.parse.quote(json.dumps({'user_id': get_random_id() if user_id == "" else user_id,
                                           'user_name': user_name,
                                           'mail': mail}))


def parse_cookie(cookie_string):
    tmp = json.loads(urllib.parse.unquote(cookie_string))
    return tmp


@app.route('/omerzaks')
def omer_zaks_funk():
    return omer_zaks


@app.route('/get_graph', methods=['GET'])
def get_graph():
    print ("in get_graph")
    if 'node_id' in request.args:
        main_node_id = request.args.get('node_id')
    else:
        main_node_id = '0'

    if main_node_id not in G.nodes:
        main_node_id = '0'

    resp = make_response(json.dumps({'node': main_node_id, 'graph': G.export_to_dict()}))
    return resp


@app.route('/', methods=['GET'])
def main_page():
    resp = send_from_directory("site", "index.html")
    if 'user_cookie' not in request.cookies:
        user_id = str( len(USERS_DICT)).zfill(4)
        resp.set_cookie('user_cookie', create_cookie(user_id))
        USERS_DICT[user_id] = User(user_id=user_id, user_name="", mail="")
        print(USERS_DICT)

    return resp

@app.route('/index.html', methods=['GET'])
def main_page2():
    return("PLEASE, USE THE ./ ROOT PATH")

@app.route('/get_node', methods=['GET'])
def get_node():
    print ("in get_node")
    if 'node_id' in request.args:
        main_node_id = request.args.get('node_id')
    else:
        return 'get_node: missing node_id'

    if main_node_id not in G.nodes:
        return 'get_node: invalid node_id'

    return json.dumps(G.nodes[main_node_id].export_to_dict())


@app.route('/branch', methods=['GET'])
def branch_from_node():
    print ("in branch_from_node")
    user_data = parse_cookie(request.cookies.get('user_cookie'))
    user_id = user_data['user_id']
    if 'node_id' in request.args:
        parent_node_id = request.args.get('node_id')
        new_node = G.add_node(user_id=user_id, drawing=None, parent_node_id=parent_node_id, is_finished=False)
        print(G.export_to_dict())
    else:
        return "branch: missing node_id"
    return new_node.node_id


@app.route('/submit', methods=['POST'])
def submit_node():
    print ("in submit_node")
    user_data = parse_cookie(request.cookies.get('user_cookie'))
    user_id = user_data['user_id']
    db_user_data = USERS_DICT[user_id]
    print(request.form)
    print(USERS_DICT)
    if 'node_id' in request.form:
        node_id = request.form.get('node_id')
        if 'drawing' not in request.form:
            return "submit: missing drawing"
        G.nodes[node_id].drawing = request.form.get('drawing')
        G.nodes[node_id].is_finished = True
    else:
        return "submit: missing node_id"

    if 'user_name' in request.form and request.form.get('user_name') != '':
        user_name = request.form.get('user_name')
    else:
        user_name = db_user_data.user_name

    if 'mail' in request.form and request.form.get('mail') != '':
        mail = request.form.get('mail')
    else:
        mail = db_user_data.mail

    USERS_DICT[user_id].user_name = user_name
    USERS_DICT[user_id].mail = mail
    resp = make_response("success")
    resp.set_cookie('user_cookie', create_cookie(user_id=user_id, user_name=user_name, mail=mail))
    return resp

@app.route('/<path:path>')
def send(path):
    return send_from_directory('site', path)

G = Graph()
u1 = User("0000", "admin", "admin@drawt.com")
USERS_DICT = {u1.user_id : u1}
node1 = G.add_node(user_id=u1.user_id, drawing="", parent_node_id=None, is_finished=True)
node2 = G.add_node(user_id=u1.user_id, drawing="", parent_node_id=node1.node_id, is_finished=False)
if __name__ == '__main__':
    app.run(port=5001, debug=True)
