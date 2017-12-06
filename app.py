import json
import pickle
import urllib
from flask import Flask, render_template, request, make_response, send_from_directory
from flask_cors import CORS, cross_origin

from drawing_graph import Graph, get_random_id
from drawing_graph import User

app = Flask(__name__)
CORS(app)

def create_cookie(user_id="", user_name = "", mail = ""):
    #coo = "user_id=%s;user_name=%s;mail=%s" % (user_id, user_name, mail)
    return urllib.parse.quote(json.dumps({'user_id': get_random_id() if user_id == "" else user_id,
                                           'user_name': user_name,
                                           'mail': mail}))


def parse_cookie(cookie_string):
    tmp = json.loads(urllib.parse.unquote(cookie_string))
    print (type(tmp))
    return tmp


@app.route('/')
def hello_world():
    return 'Welcome Inkathon!'


@app.route('/omerzaks')
def omer_zaks():
    return '<3 ' * 10000


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
    #check for cookie. if no cookie, set cookie.
    if 'user_cookie' not in request.cookies:
        resp.set_cookie('user_cookie', create_cookie())

    return resp


@app.route('/branch', methods=['GET'])
def branch_from_node():
    print ("in branch_from_node")
    user_data = parse_cookie(request.cookies.get('user_cookie'))
    user_id = user_data['user_id']
    if 'node_id' in request.args:
        parent_node_id = request.args.get('node_id')
        new_node = G.add_node(user_id=user_id, drawing=None, parent_node_id=parent_node_id, state="in progress")
    else:
        return "branch: missing node_id"
    return new_node.node_id


@app.route('/submit', methods=['POST'])
def submit_node():
    print ("in submit_node")
    user_data = parse_cookie(request.cookies.get('user_cookie'))
    user_id = user_data['user_id']
    if 'node_id' in request.form:
        node_id = request.form.get('node_id')
        node = G.nodes[node_id]
        if 'drawing' not in request.form:
            return "submit: missing drawing"
        node.drawing = request.form.get('drawing')
        node.state = "done"
    else:
        return "submit: missing node_id"
    if 'user_name' in request.form:
        user_name = request.form.get('user_name')
    else:
        user_name = user_data['user_name']
    if 'mail' in request.form:
        mail = request.form.get('mail')
    else:
        mail = user_data['mail']

    resp = make_response("success")
    resp.set_cookie('user_cookie', create_cookie(user_id=user_id, user_name=user_name, mail=mail))
    return resp

@app.route('/<path:path>')
def send(path):
    return send_from_directory('site', path)

G = Graph()
node1 = G.add_node(user_id="u123", drawing="", parent_node_id=None, state="in progress")
node2 = G.add_node(user_id="u123", drawing="", parent_node_id=node1.node_id, state="done")
if __name__ == '__main__':

    app.run(port=5001, debug=True)
