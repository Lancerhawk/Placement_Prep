import { useState, useRef } from 'react';
import './Resume.css';

type ResumeData = {
  fullName: string;
  email: string;
  phone: string;
  portfolioUrl: string;
  education: Array<{ institution: string; degree: string; year: string }>;
  experience: Array<{ company: string; role: string; duration: string; description: string }>;
  skills: string[];
};

export default function Resume() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData>({
    fullName: 'John Doe',
    email: 'john.doe@email.com',
    phone: '',
    portfolioUrl: '',
    education: [],
    experience: [],
    skills: [],
  });
  const [activeStep] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    
    // setup the preview
    if (file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else if (file.type.includes('image')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }

    // extract the text from the resume
    await parseResume(file);
  };

  const parseResume = async (file: File) => {
    try {
      if (file.type === 'application/pdf') {
        // handle pdf files
        const formData = new FormData();
        formData.append('file', file);
        
        // could send to backend later, but for now just extract text here
        const text = await extractTextFromPDF(file);
        parseTextContent(text);
      } else if (file.type === 'text/plain') {
        const text = await file.text();
        parseTextContent(text);
      } else {
        // try to get text from other file types
        const text = await extractTextFromFile(file);
        parseTextContent(text);
      }
    } catch (error) {
      console.error('Error parsing resume:', error);
    }
  };

  const extractTextFromPDF = async (_file: File): Promise<string> => {
    // placeholder for now - will need proper pdf parsing later
    return '';
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const parseTextContent = (text: string) => {
    // find email, phone, name using regex
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = text.match(/[\d\s\-\(\)\+]{10,}/);
    const nameMatch = text.match(/^[A-Z][a-z]+\s+[A-Z][a-z]+/m);

    if (emailMatch) setResumeData(prev => ({ ...prev, email: emailMatch[0] }));
    if (phoneMatch) setResumeData(prev => ({ ...prev, phone: phoneMatch[0].trim() }));
    if (nameMatch) setResumeData(prev => ({ ...prev, fullName: nameMatch[0] }));

    // check for common tech skills
    const skillsKeywords = ['JavaScript', 'Python', 'React', 'Node.js', 'Java', 'C++', 'SQL', 'MongoDB', 'AWS'];
    const foundSkills = skillsKeywords.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    );
    if (foundSkills.length > 0) {
      setResumeData(prev => ({ ...prev, skills: foundSkills }));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const steps = [
    { id: 0, label: 'Contact Information', icon: '👤' },
    { id: 1, label: 'Education', icon: '🎓' },
    { id: 2, label: 'Experience', icon: '💼' },
    { id: 3, label: 'Skills', icon: '⚙️' },
    { id: 4, label: 'Review', icon: '✅' },
  ];

  return (
    <div className="resume-page">
      <div className="resume-header">
        <h2 style={{ marginTop: 0 }}>Manage Your Resume</h2>
        <button className="btn-createNewResume">+ Create New Resume</button>
      </div>

      <div className="resume-layout">
        <div className="resume-left">
          <div 
            className={`upload-area ${isDragging ? 'dragging' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
            <div className="upload-icon">📄</div>
            <div className="upload-title">Upload Resume</div>
            <div className="upload-subtitle">Drag & drop your file here or click to browse</div>
            <button className="btn-gradient upload-btn">Upload</button>
          </div>

          {uploadedFile && (
            <div className="resume-form">
              <div className="steps-indicator">
                {steps.map((step, idx) => (
                  <div key={step.id} className="step-item">
                    <div className={`step-icon ${activeStep === step.id ? 'active' : ''}`}>
                      {step.icon}
                    </div>
                    {idx < steps.length - 1 && <div className={`step-line ${activeStep > step.id ? 'active' : ''}`} />}
                  </div>
                ))}
              </div>

              {activeStep === 0 && (
                <div className="form-section">
                  <h3>Contact Information</h3>
                  <p className="section-subtitle">Start by telling us who you are.</p>
                  <button className="btn-gradient linkedin-btn">🔗 Import from LinkedIn</button>
                  
                  <div className="form-grid">
                    <div>
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={resumeData.fullName}
                        onChange={(e) => setResumeData(prev => ({ ...prev, fullName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label>Email</label>
                      <input
                        type="email"
                        value={resumeData.email}
                        onChange={(e) => setResumeData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label>Phone</label>
                      <input
                        type="tel"
                        value={resumeData.phone}
                        onChange={(e) => setResumeData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label>Portfolio URL</label>
                      <input
                        type="url"
                        value={resumeData.portfolioUrl}
                        onChange={(e) => setResumeData(prev => ({ ...prev, portfolioUrl: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 1 && (
                <div className="form-section">
                  <h3>Education</h3>
                  <p className="section-subtitle">Add your educational background.</p>
                  {/* todo: add education form fields */}
                </div>
              )}

              {activeStep === 2 && (
                <div className="form-section">
                  <h3>Experience</h3>
                  <p className="section-subtitle">Add your work experience.</p>
                  {/* todo: add experience form fields */}
                </div>
              )}

              {activeStep === 3 && (
                <div className="form-section">
                  <h3>Skills</h3>
                  <p className="section-subtitle">List your skills and expertise.</p>
                  {/* todo: add skills form fields */}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="resume-right">
          <div className="preview-section">
            <h3>Resume Preview</h3>
            <div className="preview-box">
              {previewUrl ? (
                <iframe src={previewUrl} className="preview-iframe" />
              ) : (
                <div className="preview-placeholder">
                  <div className="preview-icon">👁️</div>
                  <p>Upload or create a resume to see a preview.</p>
                </div>
              )}
            </div>
          </div>

          <div className="suggestions-section">
            <h3>AI Suggestions</h3>
            <div className="suggestions-box">
              <div className="suggestion-category">Improve Phrasing</div>
              <div className="suggestion-text">
                Rephrase "Responsible for managing team" to "Led a team of 5 engineers to..."
              </div>
              <button className="btn-gradient">Apply Suggestion</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


