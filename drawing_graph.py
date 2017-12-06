import random


def get_random_id(num_bits=16):
    return hex(random.randint(0, 2 ** num_bits))[2:].zfill(int(num_bits / 4))


class User(object):
    def __init__(self, user_id, user_name=None, mail=None):
        self.user_id = user_id
        self.user_name = user_name
        self.mail = mail


class Node(object):
    def __init__(self, node_id, user_id, drawing, parent_node_id, is_finished =False):
        self.node_id = node_id
        self.user_id = user_id
        self.parent_node_id = parent_node_id
        self.drawing = drawing
        self.is_finished = is_finished
        self.children_node_ids = []

    def export_to_dict(self):
        return {
            "node_id" : self.node_id,
            "user_id": self.user_id,
            "parent_node_id": self.parent_node_id,
            "drawing": self.drawing,
            "is_finished": self.is_finished,
            "children_node_ids": self.children_node_ids
            }


class Graph(object):
    def __init__(self):
        self.nodes = {}

    def add_node(self, user_id, drawing, parent_node_id, is_finished):
        assert parent_node_id in self.nodes or parent_node_id is None

        node_id = str(len(self.nodes))
        new_node = Node(node_id, user_id, drawing, parent_node_id, is_finished)
        if parent_node_id is not None:
            self.nodes[parent_node_id].children_node_ids.append(node_id)
        self.nodes[node_id] = new_node
        return new_node

    def export_to_dict(self):
        return {node_id: node.export_to_dict() for node_id, node in self.nodes.items()}
