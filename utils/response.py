from flask import jsonify

def ok(data=None, message="success", status=200):
    return jsonify({"success": True, "data": data, "message": message}), status

def fail(message="error", status=400, data=None):
    return jsonify({"success": False, "data": data, "message": message}), status
