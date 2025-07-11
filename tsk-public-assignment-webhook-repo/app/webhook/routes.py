from flask import Blueprint, request, jsonify
from bson import json_util
from app.extensions import client
import json
from dateutil.parser import parse


webhook = Blueprint('Webhook', __name__, url_prefix='/webhook')

#Github Webhook triggers this method
@webhook.route('/receiver', methods=["POST"])
def receiver():
    try:

        #Fetch webhook data according to the github event - PUSH, PULL_REQUEST or MERGE
        
        github_event = request.environ.get("HTTP_X_GITHUB_EVENT", "")
        data = request.get_json(silent=True, force=True)

        request_id = data.get("after", "") or data.get("pull_request", {}).get("head", {}).get("sha", "")
        author = data.get("sender", {}).get("login", "unknown")
        action = github_event

        to_branch = data.get("ref", "").split("/")[-1] if github_event == "push" else data.get("pull_request", {}).get("base", {}).get("ref", "")
        from_branch = None
        timestamp = None

        if github_event == "push":
            commit_msg = data.get("head_commit", {}).get("message", "")
            timestamp = data.get("head_commit", {}).get("timestamp", "")
            if "from" in commit_msg.lower():
                parts = commit_msg.lower().split("from ")
                if len(parts) > 1:
                    from_branch = parts[1].split("\n")[0].strip()

        elif github_event == "pull_request":
            
            pr_data = data.get("pull_request", {})
            from_branch = pr_data.get("head", {}).get("ref", "")
            to_branch = pr_data.get("base", {}).get("ref", "")
            timestamp = pr_data.get("updated_at", "")
            merged = pr_data.get("merged", False)
            
            # Override action type to show merged PR clearly
            if merged:
                action = "pull_request_merged"
        
        try:
            timestamp1 = parse(timestamp)
            hours = timestamp1.hour
            minutes = timestamp1.minute
            days = timestamp1.day
        except Exception as e:
            print(e)

        time = {"hours": str(hours), "minutes": str(minutes), "days": str(days)} 
        
        #Map data to fields
        doc = {
            "request_id": request_id,
            "author": author,
            "action": action,
            "from_branch": from_branch,
            "to_branch": to_branch,
            "timestamp": timestamp,
            "time": time
        }

        db = client.get_database("webhook").get_collection("webhook")
        print(db.insert_one(doc))
        return {}, 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


#Fetch webhook data from MongoDB
@webhook.route('/data', methods=['GET'])
def get_webhooks():
    try:
        ref = client.get_database("webhook").get_collection("webhook")
        data = list(ref.find().sort("timestamp", -1))
        
        #Stats count
        total = ref.count_documents({})
        push = ref.count_documents({"action": "push"})
        pull_requests = ref.count_documents({"action": "pull_request"})
        pull_request_merged = ref.count_documents({"action": "pull_request_merged"})  

        stats = {
            "total": total, 
            "pushes": push, 
            "pull_requests": pull_requests, 
            "pull_request_merged": pull_request_merged
        }
        
        # Return both data and stats
        return {
            "webhooks": json.loads(json_util.dumps(data)),
            "stats": stats
        }, 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
