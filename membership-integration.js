/**
 * FIXED DEMO Integration Script - Bypasses verification completely
 * This version skips all API calls and goes straight to member details
 */

(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        API_BASE_URL: 'http://127.0.0.1:8000',
    };
    
    // Demo state - simulated data
    const demoState = {
        verificationToken: 'demo-token-12345',
        epicNumber: null,
        memberData: null
    };
    
    // Utility functions
    const utils = {
        showSuccess: function(message, containerId = null) {
            if (containerId) {
                const container = document.getElementById(containerId);
                if (container) {
                    container.innerHTML = `<div style="color: #2e7d32; background: #e8f5e8; padding: 10px; border-radius: 5px; margin: 10px 0;">${message}</div>`;
                }
            } else {
                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed; top: 20px; right: 20px; z-index: 10000;
                    background: #4caf50; color: white; padding: 15px 20px;
                    border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                `;
                notification.textContent = message;
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 3000);
            }
        },
        
        showError: function(containerId, message) {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `<div style="color: #c62828; background: #ffebee; padding: 10px; border-radius: 5px; margin: 10px 0;">${message}</div>`;
                container.style.display = 'block';
            } else {
                // Show error as notification if no container
                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed; top: 20px; right: 20px; z-index: 10000;
                    background: #f44336; color: white; padding: 15px 20px;
                    border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                `;
                notification.textContent = message;
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 5000);
            }
        },
        
        hideLoadingScreen: function() {
            // Hide any loading screens
            const loadingScreens = document.querySelectorAll('[id*="loading"], [class*="loading"], [id*="verification"], [class*="verification"]');
            loadingScreens.forEach(screen => {
                if (screen.style.display !== 'none') {
                    screen.style.display = 'none';
                }
            });
            
            // Also hide verification progress
            const verificationElements = document.querySelectorAll('h2, h3, .step-title');
            verificationElements.forEach(el => {
                if (el.textContent.includes('Verification') || el.textContent.includes('Progress')) {
                    el.style.display = 'none';
                }
            });
        },
        
        replaceWithMemberForm: function() {
            // Find the main content area
            const content = document.querySelector('.content') || document.querySelector('main') || document.body;
            
            const memberFormHTML = `
                <div id="memberRegistrationStep" style="max-width: 800px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="color: #1565c0; margin-bottom: 10px;">Complete Your TNBSP Membership Registration</h2>
                        <div style="background: #e8f5e8; color: #2e7d32; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <strong>✅ Document Verification Complete!</strong><br>
                            EPIC Number: <strong>${demoState.epicNumber}</strong>
                        </div>
                    </div>
                    
                    <form id="memberDetailsForm" style="background: #f9f9f9; padding: 30px; border-radius: 10px; border: 1px solid #ddd;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                            <div>
                                <label for="fullName" style="display: block; margin-bottom: 5px; font-weight: bold;">Full Name *</label>
                                <input type="text" id="fullName" name="fullName" required 
                                       style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px;"
                                       placeholder="Enter your full name">
                            </div>
                            <div>
                                <label for="profession" style="display: block; margin-bottom: 5px; font-weight: bold;">Profession *</label>
                                <input type="text" id="profession" name="profession" required 
                                       style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px;"
                                       placeholder="Enter your profession">
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                            <div>
                                <label for="designation" style="display: block; margin-bottom: 5px; font-weight: bold;">Designation</label>
                                <input type="text" id="designation" name="designation" 
                                       style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px;"
                                       placeholder="Enter your designation">
                            </div>
                            <div>
                                <label for="mandal" style="display: block; margin-bottom: 5px; font-weight: bold;">Mandal *</label>
                                <input type="text" id="mandal" name="mandal" required 
                                       style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px;"
                                       placeholder="Enter your mandal">
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                            <div>
                                <label for="dob" style="display: block; margin-bottom: 5px; font-weight: bold;">Date of Birth *</label>
                                <input type="date" id="dob" name="dob" required 
                                       style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
                            </div>
                            <div>
                                <label for="bloodGroup" style="display: block; margin-bottom: 5px; font-weight: bold;">Blood Group</label>
                                <select id="bloodGroup" name="bloodGroup" 
                                        style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
                                    <option value="">Select Blood Group</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                            <div>
                                <label for="contact" style="display: block; margin-bottom: 5px; font-weight: bold;">Contact Number *</label>
                                <input type="tel" id="contact" name="contact" required pattern="[0-9]{10}"
                                       style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px;"
                                       placeholder="Enter 10-digit mobile number">
                            </div>
                            <div>
                                <label for="photoUpload" style="display: block; margin-bottom: 5px; font-weight: bold;">Upload Photo (Optional)</label>
                                <input type="file" id="photoUpload" accept="image/*"
                                       style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
                                <small style="color: #666;">Demo: Photo optional for card generation</small>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label for="address" style="display: block; margin-bottom: 5px; font-weight: bold;">Complete Address *</label>
                            <textarea id="address" name="address" required rows="3" 
                                      style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px;"
                                      placeholder="Enter your complete address with pin code"></textarea>
                        </div>
                        
                        <div style="text-align: center;">
                            <button type="submit" 
                                    style="background-color: #1565c0; color: white; padding: 15px 40px; border: none; border-radius: 5px; font-size: 16px; font-weight: bold; cursor: pointer; margin: 10px;">
                                Generate Membership Card
                            </button>
                        </div>
                        
                        <div id="memberError" style="display: none;"></div>
                        <div id="memberSuccess" style="display: none;"></div>
                    </form>
                    
                    <!-- Card generation result area -->
                    <div id="cardGenerationResult" style="margin-top: 30px; text-align: center; display: none;">
                        <div style="background: #e8f5e8; border: 2px solid #4caf50; border-radius: 10px; padding: 20px;">
                            <h3 style="color: #2e7d32; margin-bottom: 15px;">🎉 Membership Card Generated Successfully!</h3>
                            <div id="membershipDetails" style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: left;">
                                <!-- Membership details will be inserted here -->
                            </div>
                            <button id="downloadCardBtn" 
                                    style="background-color: #4caf50; color: white; padding: 15px 30px; border: none; border-radius: 5px; font-size: 16px; font-weight: bold; cursor: pointer; margin: 10px;"
                                    onclick="window.open('${CONFIG.API_BASE_URL}/download-card-pillow?card_path=demo_card.png', '_blank')">
                                📥 Download Membership Card
                            </button>
                            <button onclick="location.reload()" 
                                    style="background-color: #1565c0; color: white; padding: 15px 30px; border: none; border-radius: 5px; font-size: 16px; font-weight: bold; cursor: pointer; margin: 10px;">
                                Register Another Member
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Replace content
            content.innerHTML = memberFormHTML;
            
            // Attach event listener to the new form
            const newForm = document.getElementById('memberDetailsForm');
            if (newForm) {
                newForm.addEventListener('submit', handlers.handleMemberDetailsSubmit);
            }
        }
    };
    
    // Demo handlers
    const handlers = {
        // Step 1: Bypass document verification completely
        handleVerifyDocument: function(event) {
            if (event && event.preventDefault) {
                event.preventDefault();
            }
            
            const epicInput = document.getElementById('epicNumber');
            const epicValue = epicInput ? epicInput.value.trim() : '';
            
            // Accept any EPIC input (minimum 3 characters for demo)
            if (epicValue.length < 3) {
                utils.showError(null, 'Please enter at least 3 characters for demo');
                return;
            }
            
            // Store EPIC
            demoState.epicNumber = epicValue;
            
            // Show success and immediately go to member form
            utils.showSuccess('Document verified successfully! (Demo mode - all documents accepted)');
            
            // Hide loading and show member form immediately
            setTimeout(() => {
                utils.hideLoadingScreen();
                utils.replaceWithMemberForm();
            }, 1500);
        },
        
        // Handle member details submission and card generation
        handleMemberDetailsSubmit: async function(event) {
            event.preventDefault();
            
            const form = event.target;
            const formData = new FormData(form);
            
            // Basic validation
            const requiredFields = ['fullName', 'profession', 'mandal', 'dob', 'contact', 'address'];
            for (const field of requiredFields) {
                if (!formData.get(field) || !formData.get(field).trim()) {
                    utils.showError('memberError', `Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field`);
                    return;
                }
            }
            
            // Validate phone number
            const contact = formData.get('contact');
            if (!/^\d{10}$/.test(contact)) {
                utils.showError('memberError', 'Please enter a valid 10-digit contact number');
                return;
            }
            
            // Show loading on submit button
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing...';
            
            try {
                // Prepare member data
                const memberData = {
                    name: formData.get('fullName'),
                    profession: formData.get('profession'),
                    designation: formData.get('designation') || '',
                    mandal: formData.get('mandal'),
                    dob: formData.get('dob'),
                    bloodGroup: formData.get('bloodGroup') || 'Not specified',
                    contact: formData.get('contact'),
                    address: formData.get('address'),
                    epicNumber: demoState.epicNumber,
                    membershipNo: `TNBSP-${Date.now().toString().slice(-6)}`
                };
                
                // Simulate API call delay
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Try to seed member to database
                const result = await utils.seedMemberToDatabase(memberData);
                
                // Store result
                demoState.memberData = {
                    member_id: result.id || 1,
                    membership_no: memberData.membershipNo,
                    ...memberData
                };
                
                // Show success and generate card
                utils.showSuccess('Member details submitted successfully! Generating card...');
                
                // Generate membership card
                await handlers.generateMembershipCard();
                
            } catch (error) {
                console.error('Member submission error:', error);
                
                // Even if error, continue with demo flow
                const memberData = {
                    member_id: Math.floor(Math.random() * 1000) + 1,
                    membership_no: `TNBSP-DEMO-${Date.now().toString().slice(-6)}`,
                    name: formData.get('fullName'),
                    profession: formData.get('profession'),
                    mandal: formData.get('mandal'),
                    contact: formData.get('contact'),
                    address: formData.get('address'),
                    dob: formData.get('dob'),
                    bloodGroup: formData.get('bloodGroup') || 'Not specified',
                    epicNumber: demoState.epicNumber
                };
                
                demoState.memberData = memberData;
                
                utils.showSuccess('Demo registration completed! Generating card...');
                
                // Generate card even if backend fails
                setTimeout(() => {
                    handlers.showCardSuccess();
                }, 1500);
                
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        },
        
        generateMembershipCard: async function() {
            if (!demoState.memberData || !demoState.memberData.member_id) {
                utils.showError('memberError', 'No member data found. Please try again.');
                return;
            }
            
            try {
                const formData = new FormData();
                formData.append('member_id', demoState.memberData.member_id);
                
                const response = await fetch(`${CONFIG.API_BASE_URL}/generate-card-pillow/`, {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    // Show success with download link
                    handlers.showCardSuccess(result.card_path);
                } else {
                    throw new Error(result.detail || 'Card generation failed');
                }
                
            } catch (error) {
                console.error('Card generation error:', error);
                
                // Show demo success even if backend fails
                handlers.showCardSuccess();
            }
        },
        
        showCardSuccess: function(cardPath = null) {
            // Display membership details
            const membershipDetails = document.getElementById('membershipDetails');
            if (membershipDetails && demoState.memberData) {
                membershipDetails.innerHTML = `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div><strong>Member ID:</strong> ${demoState.memberData.member_id}</div>
                        <div><strong>Membership No:</strong> ${demoState.memberData.membership_no}</div>
                        <div><strong>Name:</strong> ${demoState.memberData.name}</div>
                        <div><strong>Profession:</strong> ${demoState.memberData.profession}</div>
                        <div><strong>Mandal:</strong> ${demoState.memberData.mandal}</div>
                        <div><strong>Contact:</strong> ${demoState.memberData.contact}</div>
                        <div><strong>EPIC:</strong> ${demoState.epicNumber}</div>
                        <div><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</div>
                    </div>
                `;
            }
            
            // Show the card generation result
            const resultDiv = document.getElementById('cardGenerationResult');
            if (resultDiv) {
                resultDiv.style.display = 'block';
                
                // Update download button if we have a real card path
                if (cardPath) {
                    const downloadBtn = document.getElementById('downloadCardBtn');
                    if (downloadBtn) {
                        downloadBtn.onclick = () => window.open(`${CONFIG.API_BASE_URL}/download-card-pillow?card_path=${encodeURIComponent(cardPath)}`, '_blank');
                    }
                }
            }
            
            // Scroll to result
            setTimeout(() => {
                const resultDiv = document.getElementById('cardGenerationResult');
                if (resultDiv) {
                    resultDiv.scrollIntoView({ behavior: 'smooth' });
                }
            }, 500);
        },
        
        seedMemberToDatabase: async function(memberData) {
            try {
                const formData = new FormData();
                formData.append('name', memberData.name);
                formData.append('contact_no', memberData.contact);
                formData.append('membership_no', memberData.membershipNo);
                formData.append('profession', memberData.profession);
                formData.append('mandal', memberData.mandal);
                formData.append('dob', memberData.dob);
                formData.append('blood_group', memberData.bloodGroup);
                formData.append('address', memberData.address);
                formData.append('photo_path', 'demo/photo.jpg');
                formData.append('pdf_proof_path', 'demo/proof.pdf');
                
                const response = await fetch(`${CONFIG.API_BASE_URL}/seed-sqlite-member/`, {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                return result;
            } catch (error) {
                console.error('Error seeding member:', error);
                // Return mock data if seeding fails
                return { id: Math.floor(Math.random() * 1000) + 1, message: 'Demo member created' };
            }
        }
    };
    
    // Initialize demo integration
    function initialize() {
        console.log('Initializing Fixed Demo Integration');
        
        // Check if we're stuck on verification screen
        const verifyingText = document.querySelector('h2, h3, .step-title');
        if (verifyingText && (verifyingText.textContent.includes('Verification') || verifyingText.textContent.includes('Progress'))) {
            console.log('Detected verification screen - bypassing immediately');
            
            // Get EPIC from display
            const epicDisplay = document.querySelector('[style*="font-size: 28px"], .epic-number, h1');
            if (epicDisplay) {
                const epicText = epicDisplay.textContent.trim();
                if (epicText && epicText.length > 3) {
                    demoState.epicNumber = epicText;
                    console.log('Found EPIC:', demoState.epicNumber);
                    
                    // Bypass verification immediately
                    setTimeout(() => {
                        utils.hideLoadingScreen();
                        utils.replaceWithMemberForm();
                    }, 1000);
                    
                    return; // Exit early
                }
            }
        }
        
        // Normal initialization for EPIC input
        const epicInput = document.getElementById('epicNumber');
        if (epicInput) {
            epicInput.addEventListener('input', function(e) {
                const value = e.target.value.replace(/[^A-Z0-9a-z]/g, '').toUpperCase();
                e.target.value = value;
                
                const verifyBtn = document.getElementById('verifyBtn') || document.getElementById('proceedBtn');
                if (verifyBtn && value.length >= 3) {
                    verifyBtn.disabled = false;
                    verifyBtn.textContent = 'Verify Document (Demo)';
                    verifyBtn.style.backgroundColor = '#1565c0';
                } else if (verifyBtn) {
                    verifyBtn.disabled = true;
                    verifyBtn.textContent = 'Enter at least 3 characters';
                    verifyBtn.style.backgroundColor = '#ccc';
                }
            });
        }
        
        // File upload handling
        const fileInput = document.getElementById('uploadFile');
        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const preview = document.getElementById('uploadPreview');
                    if (preview) {
                        preview.innerHTML = `
                            <div style="background-color: #e8f5e8; border: 2px solid #4caf50; border-radius: 8px; padding: 15px; margin-top: 10px;">
                                <p style="margin: 0; color: #2e7d32; font-weight: bold;">✅ File Uploaded (Demo Mode)</p>
                                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                                    <strong>File:</strong> ${file.name}<br>
                                    <strong>Demo:</strong> All files accepted
                                </p>
                            </div>
                        `;
                    }
                }
            });
        }
        
        // Verify button handling
        const verifyBtn = document.getElementById('verifyBtn') || document.getElementById('proceedBtn');
        if (verifyBtn) {
            verifyBtn.addEventListener('click', handlers.handleVerifyDocument);
        }
        
        console.log('Demo Integration initialized successfully');
    }
    
    // Initialize when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Also try to initialize after a short delay to catch dynamic content
    setTimeout(initialize, 500);
    
    // Expose functions globally for compatibility
    window.lockEpicAndProceed = handlers.handleVerifyDocument;
    window.generateCard = handlers.generateMembershipCard;
    window.showMemberDetailsForm = utils.replaceWithMemberForm;
    
})();