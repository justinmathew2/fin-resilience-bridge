import os
from flask import Flask, request, jsonify, render_template
from werkzeug.utils import secure_filename
from gemini_service import PolicyRescueService

app = Flask(__name__)

# Basic Configuration
app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max limit
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize Google Service (Gemini)
# Ensure GEMINI_API_KEY is set in your environment
policy_service = PolicyRescueService()

# Ensure we only accept images
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/rescue', methods=['POST'])
def rescue_policy():
    """
    Accepts an image and a text context, processes via Google Gemini,
    and returns a structured JSON Action Plan.
    """
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded. Please provide an insurance notice image.'}), 400
    
    file = request.files['image']
    situation = request.form.get('situation', '').strip()

    if file.filename == '':
        return jsonify({'error': 'No selected file.'}), 400

    if not situation:
        return jsonify({'error': 'Please provide context about your life situation.'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        try:
            # Call Google Services / Gemini to process the multimodal input
            result = policy_service.analyze_policy(filepath, situation)
            
            # Clean up the uploaded file after processing
            if os.path.exists(filepath):
                os.remove(filepath)
                
            return jsonify(result), 200
            
        except ValueError as e:
            # Handle specifically "Unstructured" or "Incomplete" data exceptions
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({'error': str(e), 'status': 'incomplete_data'}), 422
        except Exception as e:
            # Generic catch-all for other service errors
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({'error': f"Failed to process via Google Services: {str(e)}", 'status': 'service_error'}), 500
    
    return jsonify({'error': 'Invalid file type. Please upload a valid image (PNG/JPG/JPEG).'}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
