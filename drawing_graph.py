import random


def get_random_id(num_bits=16):
    return hex(random.randint(0, 2 ** num_bits))[2:].zfill(int(num_bits / 4))


class User(object):
    def __init__(self, user_id, mail=None):
        self.user_id = user_id
        self.mail = mail
        self.drawings_list = []


class Node(object):
    def __init__(self, node_id, user_id, drawing, parent_node_id, state = "in progress"):
        self.node_id = node_id
        self.user_id = user_id
        self.parent_node_id = parent_node_id
        self.drawing = drawing
        self.state = state #options: "in_progress", "done"
        self.children_nodes_ids = []

    def export_to_dict(self):
        return {
            "node_id" : self.node_id,
            "user_id": self.user_id,
            "parent_node_id": self.parent_node_id,
            "drawing": self.drawing,
            "state": self.state,
            "children_nodes_ids": self.children_nodes_ids
            }


class Graph(object):
    def __init__(self):
        self.nodes = {}

    def add_node(self, user_id, drawing, parent_node_id, state):
        assert parent_node_id in self.nodes or parent_node_id is None

        node_id = str(len(self.nodes))
        new_node = Node(node_id, user_id, drawing, parent_node_id, state)
        if parent_node_id is not None:
            self.nodes[parent_node_id].children_nodes_ids.append(node_id)
        self.nodes[node_id] = new_node
        return new_node

    def export_to_dict(self):
        return {node_id : node.export_to_dict() for node_id, node in self.nodes.items()}