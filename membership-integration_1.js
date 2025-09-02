/**
 * TNBSP Membership Registration Integration Script
 * 
 * This script integrates the existing HTML membership registration page
 * with the FastAPI backend without modifying HTML structure or backend logic.
 * 
 * Key Features:
 * - Document verification with EPIC number validation
 * - Member details submission with photo upload
 * - Payment simulation and status updates
 * - Error handling and UI state management
 * - Support for multiple sequential submissions
 */

(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        API_BASE_URL: 'http://127.0.0.1:8000', // Change this to your FastAPI server URL
        MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_FILE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
        EPIC_PATTERN: /^[A-Z0-9]{10}$/
    };
    
    // Global state management
    const state = {
        verificationToken: null,
        epicNumber: null,
        uploadedDocument: null,
        uploadedPhoto: null,
        memberData: null,
        isEpicLocked: false,
        currentStep: 1
    };
    
    // Utility functions
    const utils = {
        /**
         * Display error message in specified container
         */
        showError: function(containerId, message) {
            const container = document.getElementById(containerId);
            if (container) {
                container.textContent = message;
                container.classList.add('show');
                container.style.display = 'block';
            }
        },
        
        /**
         * Clear error message from specified container
         */
        clearError: function(containerId) {
            const container = document.getElementById(containerId);
            if (container) {
                container.classList.remove('show');
                container.style.display = 'none';
            }
        },
        
        /**
         * Show success message in existing UI elements
         */
        showSuccess: function(message, containerId = null) {
            if (containerId) {
                const container = document.getElementById(containerId);
                if (container) {
                    container.innerHTML = `<div style="color: #2e7d32; background: #e8f5e8; padding: 10px; border-radius: 5px; margin: 10px 0;">${message}</div>`;
                }
            } else {
                // Create temporary success notification
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
                }, 5000);
            }
        },
        
        /**
         * Validate file type and size
         */
        validateFile: function(file) {
            if (!CONFIG.ALLOWED_FILE_TYPES.includes(file.type.toLowerCase())) {
                return { valid: false, error: 'Invalid file type. Please upload JPG, PNG, or PDF files only.' };
            }
            
            if (file.size > CONFIG.MAX_FILE_SIZE) {
                return { 
                    valid: false, 
                    error: `File too large. Maximum size is ${CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.` 
                };
            }
            
            if (file.size < 1024) {
                return { valid: false, error: 'File too small. Please upload a valid document file.' };
            }
            
            return { valid: true };
        },
        
        /**
         * Reset application state for new submission
         */
        resetState: function() {
            state.verificationToken = null;
            state.epicNumber = null;
            state.uploadedDocument = null;
            state.uploadedPhoto = null;
            state.memberData = null;
            state.isEpicLocked = false;
            state.currentStep = 1;
        },
        
        /**
         * Lock EPIC input field
         */
        lockEpicField: function(epicValue) {
            const epicInput = document.getElementById('epicNumber');
            if (epicInput) {
                epicInput.value = epicValue;
                epicInput.disabled = true;
                epicInput.style.backgroundColor = '#f5f5f5';
                epicInput.style.borderColor = '#4caf50';
                state.isEpicLocked = true;
                state.epicNumber = epicValue;
            }
        },
        
        /**
         * Unlock EPIC input field for retry
         */
        unlockEpicField: function() {
            const epicInput = document.getElementById('epicNumber');
            if (epicInput) {
                epicInput.disabled = false;
                epicInput.style.backgroundColor = '';
                epicInput.style.borderColor = '';
                state.isEpicLocked = false;
            }
        }
    };
    
    // API communication functions
    const api = {
        /**
         * Verify document with backend
         */
        verifyDocument: async function(epicNumber, documentFile) {
            const formData = new FormData();
            formData.append('epic_number', epicNumber);
            formData.append('pdf_file', documentFile);
            
            const response = await fetch(`${CONFIG.API_BASE_URL}/verify-document/`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.detail || 'Document verification failed');
            }
            
            return result;
        },
        
        /**
         * Submit member details to backend
         */
        submitMemberDetails: async function(formData, photoFile, verificationToken) {
            const submitData = new FormData();
            
            // Add verification token
            submitData.append('verification_token', verificationToken);
            
            // Add photo file
            submitData.append('photo_file', photoFile);
            
            // Add form fields - map HTML form names to backend expected names
            const fieldMapping = {
                'fullName': 'name',
                'profession': 'profession',
                'designation': 'designation',
                'mandal': 'mandal',
                'dob': 'dob',
                'bloodGroup': 'blood_group',
                'contact': 'contact_no',
                'address': 'address'
            };
            
            for (const [htmlName, backendName] of Object.entries(fieldMapping)) {
                const value = formData.get(htmlName);
                if (value) {
                    submitData.append(backendName, value);
                }
            }
            
            const response = await fetch(`${CONFIG.API_BASE_URL}/submit-details/`, {
                method: 'POST',
                body: submitData
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.detail || 'Member details submission failed');
            }
            
            return result;
        },
        
        /**
         * Update payment status
         */
        updatePayment: async function(memberId, status) {
            const response = await fetch(`${CONFIG.API_BASE_URL}/update-payment/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    member_id: memberId,
                    status: status
                })
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.detail || 'Payment update failed');
            }
            
            return result;
        },
        
        /**
         * Generate membership card
         */
        generateCard: async function(memberId) {
            const formData = new FormData();
            formData.append('member_id', memberId);
            
            const response = await fetch(`${CONFIG.API_BASE_URL}/generate-card-pillow/`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.detail || 'Card generation failed');
            }
            
            return result;
        }
    };
    
    // Event handlers
    const handlers = {
        /**
         * Handle EPIC number input validation
         */
        handleEpicInput: function(event) {
            if (state.isEpicLocked) return;
            
            let value = event.target.value.replace(/[^A-Z0-9]/g, '').toUpperCase();
            if (value.length > 10) {
                value = value.substring(0, 10);
            }
            event.target.value = value;
            
            utils.clearError('epicError');
            handlers.checkStep1Validity();
        },
        
        /**
         * Handle document file upload
         */
        handleDocumentUpload: function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const validation = utils.validateFile(file);
            if (!validation.valid) {
                utils.showError('uploadError', validation.error);
                event.target.value = '';
                return;
            }
            
            utils.clearError('uploadError');
            state.uploadedDocument = file;
            handlers.displayFilePreview(file, 'uploadPreview');
            handlers.checkStep1Validity();
        },
        
        /**
         * Handle photo file upload
         */
        handlePhotoUpload: function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            // For photos, only allow image types
            if (!file.type.startsWith('image/')) {
                utils.showError('photoError', 'Please upload a valid image file (JPG, PNG)');
                event.target.value = '';
                return;
            }
            
            const validation = utils.validateFile(file);
            if (!validation.valid) {
                utils.showError('photoError', validation.error);
                event.target.value = '';
                return;
            }
            
            utils.clearError('photoError');
            state.uploadedPhoto = file;
            utils.showSuccess('Photo uploaded successfully');
        },
        
        /**
         * Display file preview
         */
        displayFilePreview: function(file, previewContainerId) {
            const preview = document.getElementById(previewContainerId);
            if (!preview) return;
            
            preview.innerHTML = '';
            
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.style.cssText = 'max-width: 100%; max-height: 200px; border-radius: 8px; border: 2px solid #1565c0;';
                img.onload = () => URL.revokeObjectURL(img.src);
                preview.appendChild(img);
            }
            
            const fileInfo = document.createElement('div');
            fileInfo.innerHTML = `
                <div style="background-color: #e8f5e8; border: 2px solid #4caf50; border-radius: 8px; padding: 15px; margin-top: 10px;">
                    <p style="margin: 0; color: #2e7d32; font-weight: bold;">✅ File Successfully Uploaded</p>
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                        <strong>File:</strong> ${file.name}<br>
                        <strong>Size:</strong> ${(file.size / 1024).toFixed(1)} KB<br>
                        <strong>Type:</strong> ${file.type}
                    </p>
                </div>
            `;
            preview.appendChild(fileInfo);
        },
        
        /**
         * Check if Step 1 form is valid and update UI accordingly
         */
        checkStep1Validity: function() {
            const epicInput = document.getElementById('epicNumber');
            const proceedBtn = document.getElementById('proceedBtn') || document.getElementById('verifyBtn');
            
            if (!epicInput || !proceedBtn) return;
            
            const epicValue = epicInput.value.trim();
            const isEpicValid = CONFIG.EPIC_PATTERN.test(epicValue);
            
            if (isEpicValid && state.uploadedDocument) {
                proceedBtn.disabled = false;
                proceedBtn.textContent = 'Verify Document';
                proceedBtn.style.backgroundColor = '#1565c0';
            } else {
                proceedBtn.disabled = true;
                proceedBtn.textContent = 'Complete required fields';
                proceedBtn.style.backgroundColor = '#ccc';
            }
        },
        
        /**
         * Handle document verification submission
         */
        handleVerifyDocument: async function(event) {
            event.preventDefault();
            
            const epicInput = document.getElementById('epicNumber');
            const epicValue = epicInput ? epicInput.value.trim() : '';
            
            if (!CONFIG.EPIC_PATTERN.test(epicValue)) {
                utils.showError('epicError', 'Please enter a valid 10-character EPIC number');
                return;
            }
            
            if (!state.uploadedDocument) {
                utils.showError('uploadError', 'Please upload a verification document');
                return;
            }
            
            // Show loading state
            const submitBtn = event.target.querySelector('button[type="submit"]') || event.target;
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Verifying...';
            
            try {
                const result = await api.verifyDocument(epicValue, state.uploadedDocument);
                
                // Store verification token and lock EPIC field
                state.verificationToken = result.verification_token;
                utils.lockEpicField(epicValue);
                
                // Show success message
                utils.showSuccess(result.message || 'Document verification successful!');
                
                // Update UI to show verification success
                const successContainer = document.getElementById('uploadPreview') || document.getElementById('uploadError');
                if (successContainer) {
                    const successDiv = document.createElement('div');
                    successDiv.innerHTML = `
                        <div style="background-color: #e8f5e8; border: 2px solid #4caf50; border-radius: 8px; padding: 15px; margin: 10px 0;">
                            <h4 style="margin: 0 0 10px 0; color: #2e7d32;">✅ Verification Successful!</h4>
                            <p style="margin: 0; color: #2e7d32;">Your EPIC number has been verified. You can now proceed with member details.</p>
                        </div>
                    `;
                    successContainer.appendChild(successDiv);
                }
                
                // Enable member details form if present
                handlers.enableMemberDetailsForm();
                
            } catch (error) {
                console.error('Verification error:', error);
                utils.showError('uploadError', error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        },
        
        /**
         * Enable member details form after successful verification
         */
        enableMemberDetailsForm: function() {
            const memberForm = document.getElementById('memberDetailsForm');
            if (memberForm) {
                // Enable all form fields
                const inputs = memberForm.querySelectorAll('input, select, textarea');
                inputs.forEach(input => {
                    input.disabled = false;
                });
                
                // Show verification status in form area
                const epicDisplay = document.getElementById('finalEpicDisplay');
                if (epicDisplay) {
                    epicDisplay.textContent = state.epicNumber;
                }
            }
        },
        
        /**
         * Handle member details form submission
         */
        handleMemberDetailsSubmit: async function(event) {
            event.preventDefault();
            
            if (!state.verificationToken) {
                utils.showError('memberError', 'Verification token missing. Please verify your document first.');
                return;
            }
            
            if (!state.uploadedPhoto) {
                utils.showError('photoError', 'Please upload a photo');
                return;
            }
            
            const form = event.target;
            const formData = new FormData(form);
            
            // Validate required fields
            const requiredFields = ['fullName', 'profession', 'mandal', 'dob', 'contact', 'address'];
            for (const field of requiredFields) {
                if (!formData.get(field) || !formData.get(field).trim()) {
                    utils.showError('memberError', `Please fill in the ${field} field`);
                    return;
                }
            }
            
            // Validate contact number
            const contact = formData.get('contact');
            if (!/^\d{10}$/.test(contact)) {
                utils.showError('memberError', 'Please enter a valid 10-digit contact number');
                return;
            }
            
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            
            try {
                const result = await api.submitMemberDetails(formData, state.uploadedPhoto, state.verificationToken);
                
                // Store member data
                state.memberData = result;
                
                // Show success and update UI with membership details
                utils.showSuccess('Member details submitted successfully!');
                handlers.displayMembershipDetails(result);
                handlers.enablePaymentSection();
                
            } catch (error) {
                console.error('Member submission error:', error);
                utils.showError('memberError', error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        },
        
        /**
         * Display membership details in UI
         */
        displayMembershipDetails: function(memberData) {
            // Update membership ID display
            const memberIdDisplay = document.getElementById('memberIdDisplay') || document.getElementById('membershipId');
            if (memberIdDisplay) {
                memberIdDisplay.textContent = memberData.member_id;
            }
            
            // Update membership number display
            const membershipNoDisplay = document.getElementById('membershipNoDisplay') || document.getElementById('membershipNo');
            if (membershipNoDisplay) {
                membershipNoDisplay.textContent = memberData.membership_no;
            }
            
            // Update receipt details if present
            const receiptDetails = document.getElementById('receiptDetails');
            if (receiptDetails) {
                receiptDetails.innerHTML = `
                    <div class="receipt-item"><span>Member ID:</span><span>${memberData.member_id}</span></div>
                    <div class="receipt-item"><span>Membership No:</span><span>${memberData.membership_no}</span></div>
                    <div class="receipt-item"><span>EPIC No:</span><span>${state.epicNumber}</span></div>
                    <div class="receipt-item"><span>Status:</span><span>Pending Payment</span></div>
                `;
            }
        },
        
        /**
         * Enable payment section
         */
        enablePaymentSection: function() {
            // Look for payment buttons and enable them
            const paymentBtns = document.querySelectorAll('[onclick*="payment"], [onclick*="Payment"]');
            paymentBtns.forEach(btn => {
                btn.disabled = false;
                btn.style.backgroundColor = '#1565c0';
            });
            
            // Add payment simulation buttons if not present
            const paymentContainer = document.getElementById('paymentSection') || 
                                   document.querySelector('.button-group') || 
                                   document.querySelector('.content');
            
            if (paymentContainer && !document.getElementById('simulatePaymentSuccess')) {
                const paymentDiv = document.createElement('div');
                paymentDiv.innerHTML = `
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3>Payment Simulation</h3>
                        <p>For testing purposes, use the buttons below to simulate payment:</p>
                        <button id="simulatePaymentSuccess" class="btn" style="margin: 5px;">Simulate Payment Success</button>
                        <button id="simulatePaymentFailure" class="btn btn-secondary" style="margin: 5px;">Simulate Payment Failure</button>
                    </div>
                `;
                paymentContainer.appendChild(paymentDiv);
                
                // Add event listeners for payment simulation
                document.getElementById('simulatePaymentSuccess').addEventListener('click', () => handlers.simulatePayment('completed'));
                document.getElementById('simulatePaymentFailure').addEventListener('click', () => handlers.simulatePayment('failed'));
            }
        },
        
        /**
         * Simulate payment process
         */
        simulatePayment: async function(status) {
            if (!state.memberData || !state.memberData.member_id) {
                utils.showError('paymentError', 'Member ID not found. Please complete registration first.');
                return;
            }
            
            const btn = event.target;
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Processing...';
            
            try {
                const result = await api.updatePayment(state.memberData.member_id, status);
                
                if (status === 'completed') {
                    utils.showSuccess('Payment completed successfully!');
                    handlers.enableCardGeneration();
                    handlers.updateReceiptStatus('Paid');
                } else {
                    utils.showError('paymentError', 'Payment failed. Please try again.');
                    handlers.updateReceiptStatus('Payment Failed');
                }
                
            } catch (error) {
                console.error('Payment error:', error);
                utils.showError('paymentError', error.message);
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        },
        
        /**
         * Update receipt status
         */
        updateReceiptStatus: function(status) {
            const receiptDetails = document.getElementById('receiptDetails');
            if (receiptDetails) {
                const statusRow = receiptDetails.querySelector('.receipt-item:last-child span:last-child');
                if (statusRow) {
                    statusRow.textContent = status;
                    statusRow.style.color = status.includes('Paid') ? '#4caf50' : '#f44336';
                }
            }
        },
        
        /**
         * Enable card generation after payment
         */
        enableCardGeneration: function() {
            // Look for existing card generation button
            let cardBtn = document.querySelector('[onclick*="card"], [onclick*="Card"]');
            
            if (!cardBtn) {
                // Create card generation button
                const buttonContainer = document.querySelector('.button-group') || document.querySelector('.content');
                if (buttonContainer) {
                    cardBtn = document.createElement('button');
                    cardBtn.className = 'btn';
                    cardBtn.textContent = 'Generate Membership Card';
                    cardBtn.style.margin = '10px 5px';
                    buttonContainer.appendChild(cardBtn);
                }
            }
            
            if (cardBtn) {
                cardBtn.disabled = false;
                cardBtn.style.backgroundColor = '#1565c0';
                cardBtn.onclick = handlers.generateMembershipCard;
            }
        },
        
        /**
         * Generate membership card
         */
        generateMembershipCard: async function() {
            if (!state.memberData || !state.memberData.member_id) {
                utils.showError('cardError', 'Member ID not found. Cannot generate card.');
                return;
            }
            
            const btn = event.target;
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Generating Card...';
            
            try {
                const result = await api.generateCard(state.memberData.member_id);
                
                utils.showSuccess('Membership card generated successfully!');
                
                // Open download link
                const downloadUrl = `${CONFIG.API_BASE_URL}/download-card-pillow?card_path=${encodeURIComponent(result.card_path)}`;
                window.open(downloadUrl, '_blank');
                
            } catch (error) {
                console.error('Card generation error:', error);
                utils.showError('cardError', error.message);
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        },
        
        /**
         * Reset form for new submission
         */
        resetForm: function() {
            // Reset state
            utils.resetState();
            
            // Reset form fields
            const forms = document.querySelectorAll('form');
            forms.forEach(form => form.reset());
            
            // Reset file inputs
            const fileInputs = document.querySelectorAll('input[type="file"]');
            fileInputs.forEach(input => input.value = '');
            
            // Clear previews and errors
            const previews = document.querySelectorAll('[id*="preview"], [id*="Preview"]');
            previews.forEach(preview => preview.innerHTML = '');
            
            const errors = document.querySelectorAll('[id*="error"], [id*="Error"]');
            errors.forEach(error => {
                error.classList.remove('show');
                error.style.display = 'none';
            });
            
            // Unlock EPIC field
            utils.unlockEpicField();
            
            // Reset buttons
            const buttons = document.querySelectorAll('button');
            buttons.forEach(btn => {
                btn.disabled = false;
                if (btn.id === 'proceedBtn' || btn.id === 'verifyBtn') {
                    btn.disabled = true;
                    btn.textContent = 'Complete required fields';
                    btn.style.backgroundColor = '#ccc';
                }
            });
            
            utils.showSuccess('Form reset successfully. You can start a new registration.');
        }
    };
    
    // Initialize the integration when DOM is ready
    function initialize() {
        console.log('Initializing TNBSP Membership Integration...');
        
        // Attach event listeners to existing form elements
        
        // EPIC number input
        const epicInput = document.getElementById('epicNumber');
        if (epicInput) {
            epicInput.addEventListener('input', handlers.handleEpicInput);
            epicInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const verifyBtn = document.getElementById('proceedBtn') || document.getElementById('verifyBtn');
                    if (verifyBtn && !verifyBtn.disabled) {
                        handlers.handleVerifyDocument({ target: verifyBtn, preventDefault: () => {} });
                    }
                }
            });
        }
        
        // Document upload
        const uploadFile = document.getElementById('uploadFile');
        if (uploadFile) {
            uploadFile.addEventListener('change', handlers.handleDocumentUpload);
        }
        
        // Upload area click handler
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea && uploadFile) {
            uploadArea.addEventListener('click', () => uploadFile.click());
        }
        
        // Photo upload
        const photoUpload = document.getElementById('photoUpload');
        if (photoUpload) {
            photoUpload.addEventListener('change', handlers.handlePhotoUpload);
        }
        
        // Verify document button
        const verifyBtn = document.getElementById('proceedBtn') || document.getElementById('verifyBtn');
        if (verifyBtn) {
            verifyBtn.addEventListener('click', handlers.handleVerifyDocument);
        }
        
        // Member details form
        const memberForm = document.getElementById('memberDetailsForm');
        if (memberForm) {
            memberForm.addEventListener('submit', handlers.handleMemberDetailsSubmit);
        }
        
        // Add reset functionality if reset button exists
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', handlers.resetForm);
        }
        
        // Look for existing payment buttons and attach handlers
        const existingPaymentBtns = document.querySelectorAll('[onclick*="payment"], [onclick*="Payment"]');
        existingPaymentBtns.forEach(btn => {
            btn.onclick = null; // Remove existing onclick
            btn.addEventListener('click', () => handlers.simulatePayment('completed'));
        });
        
        console.log('TNBSP Membership Integration initialized successfully');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Expose global functions for backwards compatibility with existing onclick handlers
    window.lockEpicAndProceed = handlers.handleVerifyDocument;
    window.processPayment = () => handlers.simulatePayment('completed');
    window.generateCard = handlers.generateMembershipCard;
    window.resetForm = handlers.resetForm;
    
})();