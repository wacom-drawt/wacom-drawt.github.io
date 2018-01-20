import json
import os
import time
import pickle
from shutil import copyfile
import urllib
from flask import Flask, render_template, request, make_response, send_from_directory
from flask_cors import CORS, cross_origin
from omer_zaks import omer_zaks
from saved_images import GOOGLE_IMAGE, UNDER_CONSTRUCTION_IMAGE

from drawing_graph import Graph, get_random_id
from drawing_graph import User

app = Flask(__name__)
CORS(app)


def load_graph():
    print("started loading graph from file at time:", time.ctime(), "to be exact:", time.time())
    G = pickle.load(open("current_graph.pkl","rb"))
    print("loaded graph from file at time:", time.ctime(), "to be exact:", time.time())
    print(G.export_to_dict(full_photo=False))
    return G


def save_graph(G):
    print("started saving graph at time:", time.ctime(), "to be exact:", time.time())
    pickle.dump(G, open("current_graph.pkl", "wb"))
    print("saved graph at time:", time.ctime(), "to be exact:", time.time())
    print(G.export_to_dict(full_photo=False))


@app.route('/get_graph', methods=['GET'])
def get_graph():
    print ("in get_graph")
    time.sleep(0.5)

    if 'node_id' in request.args:
        main_node_id = request.args.get('node_id')
    else: # no center specified - center around the root
        main_node_id = '0'

    G = load_graph()

    if main_node_id not in G.nodes: # node specified non-existent
        main_node_id = '0'

    print(G.nodes.keys())
    print("printing in get_graph for debug")
    print(G.export_to_dict(full_photo=False))

    resp = make_response(json.dumps({'node': main_node_id, 'graph': G.export_to_dict()}))
    return resp


@app.route('/', methods=['GET'])
def main_page():
    return send_from_directory("site", "index.html")

"""
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
"""

"""
@app.route('/branch', methods=['GET'])
def branch_from_node():
    global G
    print ("in branch_from_node")
    if 'node_id' not in request.args:
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
"""

@app.route('/submit', methods=['POST', "OPTIONS"])
def submit_node():
    if request.method == "OPTIONS":
        resp = make_response()
        resp.headers['Access-Control-Allow-Credentials'] = "true"
        return resp

    #print("printing data I got from POST request")
    #print(dir(request))
    #print(request.form)

    print ("in submit_node")

    if 'drawing' not in request.form:
        return "submit: missing drawing"
    if 'parent_node_id' not in request.form:
        return "submit: missing node_id"

    parent_node_id = request.form.get('parent_node_id')
    print("parent_node_id I got from client: %s" % parent_node_id)

    G = load_graph()
    new_node = G.add_node(user_id="0000", drawing=request.form.get('drawing'), \
                          parent_node_id=parent_node_id, is_finished=True)
    save_graph(G)

    node_id = new_node.node_id
    print("printing in submit for debug")
    print("new node_id: %s" % node_id)
    print(G.nodes.keys())
    print(node_id in G.nodes)
    print("printing graph state")
    print(G.export_to_dict(full_photo=False))

    return node_id


@app.route('/reset_graph', methods=['GET'])
def reset_graph():
    print ("in reset_graph")
    copyfile("initial_graph.pkl", "current_graph.pkl")
    return "graph reset was successful!"

@app.route('/<path:path>')
def send(path):
    return send_from_directory('site', path)


"""
G = Graph()
#GRAPH_LOCKED = False
node1 = G.add_node(user_id="0000", drawing=GOOGLE_IMAGE, parent_node_id=None, is_finished=True)
node2 = G.add_node(user_id="0000", drawing=UNDER_CONSTRUCTION_IMAGE, parent_node_id=node1.node_id,
                   is_finished=True)
node3 = G.add_node(user_id="0000", drawing=UNDER_CONSTRUCTION_IMAGE, parent_node_id=node1.node_id,
                   is_finished=True)
print("the current directory is: %s" % os.path.realpath('.'))
pickle.dump(G, file('./initial_graph.pkl','wb'))
"""

print("this file is here: %s" % __file__)
print("the current directory is: %s" % os.path.realpath('.'))
#G = load_graph()
#save_graph(G)

#this is just a comment for redeployment on Heroku

if __name__ == '__main__':
    app.run(port=5001, debug=True)
