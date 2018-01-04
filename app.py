import json
import pickle
import urllib
from flask import Flask, render_template, request, make_response, send_from_directory
from flask_cors import CORS, cross_origin
from omer_zaks import omer_zaks
from saved_images import GOOGLE_IMAGE, UNDER_CONSTRUCTION_IMAGE

from drawing_graph import Graph, get_random_id
from drawing_graph import User

app = Flask(__name__)
CORS(app)


@app.route('/get_graph', methods=['GET'])
def get_graph():
    print ("in get_graph")
    if 'node_id' in request.args:
        main_node_id = request.args.get('node_id')
    else: # no center specified - center around the root
        main_node_id = '0'

    if main_node_id not in G.nodes: # node specified non-existent
        main_node_id = '0'

    resp = make_response(json.dumps({'node': main_node_id, 'graph': G.export_to_dict()}))
    return resp


@app.route('/', methods=['GET'])
def main_page():
    return send_from_directory("site", "index.html")


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
    if 'node_id' not in requests.args:
        return "branch: missing node_id"

    parent_node_id = request.args.get('node_id')
    new_node = G.add_node(user_id="0000", drawing=UNDER_CONSTRUCTION_IMAGE, \
                          parent_node_id=parent_node_id, is_finished=False)
    # debug prints
    print("existing nodes:")
    print(G.nodes.keys())
    print("printing graph state")
    print(G.export_to_dict(full_photo=False))

    return new_node.node_id


@app.route('/submit', methods=['POST', "OPTIONS"])
def submit_node():
    if request.method == "OPTIONS":
        resp = make_response()
        resp.headers['Access-Control-Allow-Credentials'] = "true"
        return resp

    print ("in submit_node")
    print("printing data I got from POST request")
    print(dir(request))
    print(request.form)

    if 'node_id' in request.form:
        node_id = request.form.get('node_id')
        if 'drawing' not in request.form:
            return "submit: missing drawing"
        try:
            G.nodes[node_id].drawing = request.form.get('drawing')
            G.nodes[node_id].is_finished = True
        except:
            print(G.nodes.keys())
            print(node_id in G.nodes)
    else:
        return "submit: missing node_id"

    resp = make_response("success")
    print("printing graph state")
    print(G.export_to_dict(full_photo=False))
    return resp

@app.route('/<path:path>')
def send(path):
    return send_from_directory('site', path)

G = Graph()
u1 = User("0000", "admin", "admin@drawt.com")
USERS_DICT = {u1.user_id : u1}
node1 = G.add_node(user_id=u1.user_id, drawing=GOOGLE_IMAGE, parent_node_id=None, is_finished=True)
node2 = G.add_node(user_id=u1.user_id, drawing=UNDER_CONSTRUCTION_IMAGE, parent_node_id=node1.node_id, is_finished=False)
if __name__ == '__main__':
    app.run(port=5001, debug=True)
