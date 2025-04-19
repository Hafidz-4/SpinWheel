document.addEventListener('DOMContentLoaded', function() {
    // Screen navigation elements
    const navLinks = document.querySelectorAll('.nav-link');
    const screens = document.querySelectorAll('.screen');
    const goToSpinBtn = document.getElementById('go-to-spin');
    const goToSetupBtn = document.getElementById('go-to-setup');
    
    // Input elements
    const addStudentBtn = document.getElementById('add-student');
    const addGroupBtn = document.getElementById('add-group');
    const studentNameInput = document.getElementById('student-name');
    const groupNameInput = document.getElementById('group-name');
    const studentList = document.getElementById('student-list');
    const groupList = document.getElementById('group-list');
    const studentsPerGroupInput = document.getElementById('students-per-group');
    const maxPerGroupDisplay = document.getElementById('max-per-group');
    
    // Spin wheel elements
    const spinBtn = document.getElementById('spin-btn');
    const resultBox = document.getElementById('result-box');
    const resetBtn = document.getElementById('reset-btn');
    const downloadBtn = document.getElementById('download-btn');
    const remainingCounter = document.getElementById('remaining-counter');
    const currentGroup = document.getElementById('current-group');
    const currentCount = document.getElementById('current-count');
    const canvas = document.getElementById('wheel');
    const ctx = canvas.getContext('2d');
    
    // Batch input elements
    const showBatchInputBtn = document.getElementById('show-batch-input');
    const batchInputModal = document.getElementById('batch-input-modal');
    const batchStudentNamesInput = document.getElementById('batch-student-names');
    const addBatchStudentsBtn = document.getElementById('add-batch-students');
    const closeModalBtn = document.querySelector('.close');
    
    // Data
    let students = [];
    let groups = [];
    let results = {};
    let remainingStudents = [];
    let studentsPerGroup = parseInt(studentsPerGroupInput.value) || 6;
    let currentSpinData = {
        group: null,
        count: 0,
        isSpinning: false
    };
    
    // Colors for wheel
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#8AC24A', '#FF5252',
        '#03A9F4', '#CDDC39', '#FF4081', '#009688'
    ];
    
    // Screen navigation
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');
            
            // Remove active class from all links and screens
            navLinks.forEach(l => l.classList.remove('active'));
            screens.forEach(s => s.classList.remove('active-screen'));
            
            // Add active class to clicked link and target screen
            this.classList.add('active');
            document.getElementById(targetId).classList.add('active-screen');
        });
    });
    
    goToSpinBtn.addEventListener('click', function() {
        // Switch to spin screen
        navLinks.forEach(l => l.classList.remove('active'));
        screens.forEach(s => s.classList.remove('active-screen'));
        
        document.querySelector('[data-target="spin-screen"]').classList.add('active');
        document.getElementById('spin-screen').classList.add('active-screen');
        
        // Update the max students per group display
        maxPerGroupDisplay.textContent = studentsPerGroup;
        
        // Redraw wheel to ensure it's updated
        updateRemainingStudents();
        drawWheel();
    });
    
    goToSetupBtn.addEventListener('click', function() {
        // Switch to setup screen
        navLinks.forEach(l => l.classList.remove('active'));
        screens.forEach(s => s.classList.remove('active-screen'));
        
        document.querySelector('[data-target="setup-screen"]').classList.add('active');
        document.getElementById('setup-screen').classList.add('active-screen');
    });
    
    // Update students per group setting
    studentsPerGroupInput.addEventListener('change', function() {
        studentsPerGroup = parseInt(this.value) || 6;
        maxPerGroupDisplay.textContent = studentsPerGroup;
        
        // Reset current spin if active
        if (currentSpinData.group) {
            currentSpinData.count = 0;
            currentCount.textContent = `Anggota terpilih: 0/${studentsPerGroup}`;
        }
    });
    
    // Add student
    addStudentBtn.addEventListener('click', function() {
        const name = studentNameInput.value.trim();
        if (name && !students.includes(name)) {
            students.push(name);
            studentNameInput.value = '';
            updateStudentList();
            updateRemainingStudents();
            drawWheel();
        }
    });
    
    // Add group
    addGroupBtn.addEventListener('click', function() {
        const name = groupNameInput.value.trim();
        if (name && !groups.includes(name)) {
            groups.push(name);
            groupNameInput.value = '';
            updateGroupList();
        }
    });
    
    // Batch input modal control
    showBatchInputBtn.addEventListener('click', function() {
        batchInputModal.style.display = 'block';
    });
    
    closeModalBtn.addEventListener('click', function() {
        batchInputModal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === batchInputModal) {
            batchInputModal.style.display = 'none';
        }
    });
    
    // Add batch students
    addBatchStudentsBtn.addEventListener('click', function() {
        const batchText = batchStudentNamesInput.value.trim();
        if (batchText) {
            const namesList = batchText.split('\n').filter(name => name.trim() !== '');
            let addedCount = 0;
            
            namesList.forEach(name => {
                const trimmedName = name.trim();
                if (trimmedName && !students.includes(trimmedName)) {
                    students.push(trimmedName);
                    addedCount++;
                }
            });
            
            // Update UI
            batchStudentNamesInput.value = '';
            batchInputModal.style.display = 'none';
            
            // Show notification
            if (addedCount > 0) {
                alert(`Berhasil menambahkan ${addedCount} mahasiswa baru.`);
                updateStudentList();
                updateRemainingStudents();
                drawWheel();
            } else {
                alert('Tidak ada mahasiswa baru yang ditambahkan.');
            }
        }
    });
    
    // Update student list in UI
    function updateStudentList() {
        studentList.innerHTML = '';
        students.forEach((student, index) => {
            const li = document.createElement('li');
            li.textContent = student;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Hapus';
            deleteBtn.className = 'delete-btn';
            deleteBtn.addEventListener('click', function() {
                students.splice(index, 1);
                updateStudentList();
                updateRemainingStudents();
                drawWheel();
            });
            
            li.appendChild(deleteBtn);
            studentList.appendChild(li);
        });
    }
    
    // Update group list in UI
    function updateGroupList() {
        groupList.innerHTML = '';
        groups.forEach((group, index) => {
            const li = document.createElement('li');
            li.textContent = group;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Hapus';
            deleteBtn.className = 'delete-btn';
            deleteBtn.addEventListener('click', function() {
                groups.splice(index, 1);
                updateGroupList();
            });
            
            li.appendChild(deleteBtn);
            groupList.appendChild(li);
        });
    }
    
    // Update remaining students
    function updateRemainingStudents() {
        remainingStudents = [...students].filter(student => {
            for (const group in results) {
                if (results[group].includes(student)) {
                    return false;
                }
            }
            return true;
        });
        
        remainingCounter.textContent = `Sisa mahasiswa: ${remainingStudents.length}`;
    }
    
    // Draw wheel
    function drawWheel() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (remainingStudents.length === 0) {
            // Draw empty wheel
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, 170, 0, 2 * Math.PI);
            ctx.fillStyle = '#f0f0f0';
            ctx.fill();
            ctx.stroke();
            
            ctx.font = '20px Arial';
            ctx.fillStyle = '#333';
            ctx.textAlign = 'center';
            ctx.fillText('Tidak ada mahasiswa tersisa', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        const total = remainingStudents.length;
        const anglePerSegment = (2 * Math.PI) / total;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 170;
        
        for (let i = 0; i < total; i++) {
            // Draw segment
            const startAngle = i * anglePerSegment;
            const endAngle = (i + 1) * anglePerSegment;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw text
            ctx.save();
            ctx.translate(centerX, centerY);
            const textAngle = startAngle + (anglePerSegment / 2);
            ctx.rotate(textAngle);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            
            const name = remainingStudents[i];
            // Truncate text if too long
            const displayName = name.length > 12 ? name.substring(0, 10) + '...' : name;
            ctx.fillText(displayName, radius - 30, 5);
            ctx.restore();
        }
    }
    
    // Spin animation
    function spin() {
        if (currentSpinData.isSpinning) return;
        if (remainingStudents.length === 0) {
            alert('Tidak ada mahasiswa tersisa untuk di-spin!');
            return;
        }
        
        if (!currentSpinData.group && groups.length === 0) {
            alert('Tambahkan minimal satu kelompok terlebih dahulu!');
            return;
        }
        
        // Set/select current group if not set
        if (!currentSpinData.group) {
            currentSpinData.group = groups[0];
            currentSpinData.count = 0;
            
            // Initialize results for this group
            if (!results[currentSpinData.group]) {
                results[currentSpinData.group] = [];
            }
            
            currentGroup.textContent = `Kelompok saat ini: ${currentSpinData.group}`;
            currentCount.textContent = `Anggota terpilih: ${currentSpinData.count}/${studentsPerGroup}`;
        }
        
        currentSpinData.isSpinning = true;
        
        // Random number of rotations between 4 and 6
        const rotations = 4 + Math.random() * 2;
        const total = remainingStudents.length;
        const anglePerSegment = (2 * Math.PI) / total;
        
        // Random angle within the selected segment
        const selectedIndex = Math.floor(Math.random() * total);
        
        // Animation variables
        let startAngle = 0;
        let currentAngle = 0;
        const duration = 5000; // 5 seconds
        const startTime = Date.now();
        
        // Record final angle for later calculation of actual selected student
        let finalRotationAngle;
        
        // Animation function
        function animateSpin() {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            
            // Smooth easing function for the entire animation
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            
            // Calculate target angle with extra rotations
            const targetAngle = rotations * 2 * Math.PI + (selectedIndex * anglePerSegment);
            currentAngle = startAngle + easedProgress * targetAngle;
            
            // Record final angle on last frame for determining actual selection
            if (progress === 1) {
                finalRotationAngle = currentAngle;
            }
            
            // Rotate canvas and redraw wheel
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(currentAngle);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
            drawWheel();
            ctx.restore();
            
            if (progress < 1) {
                requestAnimationFrame(animateSpin);
            } else {
                // Calculate which student is actually at the arrow position
                setTimeout(() => {
                    // Determine actual selection based on final angle
                    const actualSelectedIndex = determineSelectedIndex(finalRotationAngle, total);
                    handleSpinResult(actualSelectedIndex);
                }, 300);
            }
        }
        
        animateSpin();
    }
    
    // Function to determine which student is actually at the arrow position (at top of wheel)
    function determineSelectedIndex(finalAngle, totalSegments) {
        // Normalize the angle to be between 0 and 2π
        const normalizedAngle = finalAngle % (2 * Math.PI);
        
        // Calculate which segment is at the top (arrow position)
        // Arrow is at top (π/2 position in standard coordinate system), so we need to find which segment is there
        // Since wheel rotates clockwise, we need to calculate in opposite direction
        
        // Calculate segment size in radians
        const segmentSize = (2 * Math.PI) / totalSegments;
        
        // The segment index that's at the top (where arrow points)
        // We add totalSegments and take modulo to ensure positive result
        // Note: Adding π/2 to angle to adjust for arrow at top position
        const segmentIndex = Math.floor(totalSegments - ((normalizedAngle + Math.PI/2) / segmentSize) % totalSegments) % totalSegments;
        
        return segmentIndex;
    }
    
    // Handle spin result
    function handleSpinResult(selectedIndex) {
        // Get selected student - now the one actually under the arrow
        const selectedStudent = remainingStudents[selectedIndex];
        
        // Add to results
        results[currentSpinData.group].push(selectedStudent);
        currentSpinData.count++;
        currentCount.textContent = `Anggota terpilih: ${currentSpinData.count}/${studentsPerGroup}`;
        
        // Update results display
        updateResultsDisplay();
        
        // Update remaining students list
        updateRemainingStudents();
        
        // Check if current group is full
        if (currentSpinData.count >= studentsPerGroup) {
            // Move to next group if available
            const currentGroupIndex = groups.indexOf(currentSpinData.group);
            if (currentGroupIndex < groups.length - 1) {
                currentSpinData.group = groups[currentGroupIndex + 1];
                currentSpinData.count = 0;
                
                // Initialize results for this new group
                if (!results[currentSpinData.group]) {
                    results[currentSpinData.group] = [];
                }
            } else {
                // All groups are filled
                currentSpinData.group = null;
            }
            
            // Update group display
            if (currentSpinData.group) {
                currentGroup.textContent = `Kelompok saat ini: ${currentSpinData.group}`;
                currentCount.textContent = `Anggota terpilih: 0/${studentsPerGroup}`;
            } else {
                currentGroup.textContent = `Semua kelompok telah terisi`;
                currentCount.textContent = `Anggota terpilih: -`;
            }
        }
        
        // Redraw wheel with updated remaining students
        drawWheel();
        
        // Reset spinning flag
        currentSpinData.isSpinning = false;
    }
    
    // Update results display
    function updateResultsDisplay() {
        let displayText = '';
        
        for (const group in results) {
            displayText += `=== ${group} ===\n`;
            results[group].forEach((student, index) => {
                displayText += `${index + 1}. ${student}\n`;
            });
            displayText += '\n';
        }
        
        resultBox.textContent = displayText;
    }
    
    // Reset results
    function resetResults() {
        if (Object.keys(results).length === 0) {
            alert('Belum ada hasil untuk direset!');
            return;
        }
        
        if (confirm('Anda yakin ingin menghapus semua hasil pembagian kelompok yang sudah ada?')) {
            results = {};
            currentSpinData.group = null;
            currentSpinData.count = 0;
            
            // Update UI
            currentGroup.textContent = 'Kelompok saat ini: -';
            currentCount.textContent = `Anggota terpilih: 0/${studentsPerGroup}`;
            resultBox.textContent = '';
            
            // Update remaining students
            updateRemainingStudents();
            drawWheel();
        }
    }
    
    // Download results
    function downloadResults() {
        if (Object.keys(results).length === 0) {
            alert('Belum ada hasil untuk didownload!');
            return;
        }
        
        let content = 'HASIL PEMBAGIAN KELOMPOK MAHASISWA TI 23 K&L\n';
        content += `Generated pada: ${new Date().toLocaleString()}\n\n`;
        
        for (const group in results) {
            content += `=== ${group} ===\n`;
            results[group].forEach((student, index) => {
                content += `${index + 1}. ${student}\n`;
            });
            content += '\n';
        }
        
        // Count distribution
        content += 'STATISTIK PEMBAGIAN:\n';
        content += `Total mahasiswa: ${students.length}\n`;
        content += `Total kelompok: ${groups.length}\n`;
        content += `Mahasiswa per kelompok: ${studentsPerGroup}\n`;
        content += `Sisa mahasiswa belum terbagi: ${remainingStudents.length}\n\n`;
        
        // Create downloadable link
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hasil_pembagian_kelompok.txt';
        
        // Append to body, click, and remove
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Event listeners for action buttons
    spinBtn.addEventListener('click', spin);
    resetBtn.addEventListener('click', resetResults);
    downloadBtn.addEventListener('click', downloadResults);
    
    // Enter key for inputs
    studentNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addStudentBtn.click();
        }
    });
    
    groupNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addGroupBtn.click();
        }
    });
    
    // Initialize app
    updateRemainingStudents();
    drawWheel();
});