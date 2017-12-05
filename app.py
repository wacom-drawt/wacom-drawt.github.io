import json
import pickle
from flask import Flask, render_template, request

from drawing_graph import Graph
from drawing_graph import User

app = Flask(__name__)


@app.route('/')
def hello_world():
    return 'Welcome Inkathon!'


@app.route('/get_graph', methods=['GET'])
def get_graph():

    print ("in get_graph")
    if 'node_id' in request.args:
        main_node_id = request.args.get('node_id')
    else:
        main_node_id = '0'

    if 'node_id' in request.args:
        user_id = request.args.get('user_id')
    else:
        user_id = None

    if main_node_id not in G.nodes:
        main_node_id = '0'

    return json.dumps([{'node': main_node_id}, {'user_id': user_id}, {'graph': G.export_to_dict()}])


@app.route('/branch', methods=['GET'])
def branch_from_node():
    print ("in branch_from_node")
    user_id = request.args.get('user_id')
    if 'node_id' in request.args:
        parent_node_id = request.args.get('node_id')
        new_node = G.add_node(user_id=user_id, drawing=None,
                   parent_node_id=parent_node_id, state="in progress")
    else:
        return "missing node_id"
    return new_node.node_id


G = Graph()
node1 = G.add_node(user_id="u123", drawing="", parent_node_id=None, state="in progress")
node2 = G.add_node(user_id="u123", drawing="", parent_node_id=node1.node_id, state="done")
if __name__ == '__main__':

    app.run(port=5001, debug=True)
