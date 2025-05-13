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
    
    // Batch input elements (Mahasiswa)
    const showBatchInputBtn = document.getElementById('show-batch-input');
    const batchInputModal = document.getElementById('batch-input-modal');
    const batchStudentNamesInput = document.getElementById('batch-student-names');
    const addBatchStudentsBtn = document.getElementById('add-batch-students');
    const closeModalBtn = document.querySelector('.close'); 

    // Batch input elements (Kelompok)
    const showBatchGroupInputBtn = document.getElementById('show-batch-group-input');
    const batchGroupInputModal = document.getElementById('batch-group-input-modal');
    const batchGroupNamesInput = document.getElementById('batch-group-names');
    const addBatchGroupsBtn = document.getElementById('add-batch-groups');
    const closeGroupModalBtn = document.querySelector('.close-group-modal'); 
    
    // Data
    let students = [];
    let groups = [];
    let results = {}; // Ini yang akan direset
    let remainingStudents = [];
    let studentsPerGroup = parseInt(studentsPerGroupInput.value) || 6;
    let currentSpinData = {
        group: null,
        count: 0,
        isSpinning: false,
        currentWheelAngle: 0 
    };
    
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
            navLinks.forEach(l => l.classList.remove('active'));
            screens.forEach(s => s.classList.remove('active-screen'));
            this.classList.add('active');
            document.getElementById(targetId).classList.add('active-screen');
        });
    });
    
    goToSpinBtn.addEventListener('click', function() {
        navLinks.forEach(l => l.classList.remove('active'));
        screens.forEach(s => s.classList.remove('active-screen'));
        document.querySelector('[data-target="spin-screen"]').classList.add('active');
        document.getElementById('spin-screen').classList.add('active-screen');
        maxPerGroupDisplay.textContent = studentsPerGroup;
        updateRemainingStudents(); // Pastikan sisa mahasiswa terupdate
        drawWheel(); 
    });
    
    goToSetupBtn.addEventListener('click', function() {
        navLinks.forEach(l => l.classList.remove('active'));
        screens.forEach(s => s.classList.remove('active-screen'));
        document.querySelector('[data-target="setup-screen"]').classList.add('active');
        document.getElementById('setup-screen').classList.add('active-screen');
    });
    
    studentsPerGroupInput.addEventListener('change', function() {
        studentsPerGroup = parseInt(this.value) || 6;
        maxPerGroupDisplay.textContent = studentsPerGroup;
        if (currentSpinData.group && results[currentSpinData.group]) { // Pastikan results[currentSpinData.group] ada
            currentSpinData.count = results[currentSpinData.group].length;
            currentCount.textContent = `Anggota terpilih: ${currentSpinData.count}/${studentsPerGroup}`;
        } else if (currentSpinData.group) { // Grup ada tapi belum ada hasil
             currentSpinData.count = 0;
             currentCount.textContent = `Anggota terpilih: 0/${studentsPerGroup}`;
        } else { // Tidak ada grup aktif
            currentCount.textContent = `Anggota terpilih: 0/${studentsPerGroup}`;
        }
    });
    
    addStudentBtn.addEventListener('click', function() {
        const name = studentNameInput.value.trim();
        if (name && !students.includes(name)) {
            students.push(name);
            studentNameInput.value = '';
            updateStudentList();
            updateRemainingStudents();
            drawWheel();
        } else if (name && students.includes(name)) {
            alert("Nama mahasiswa sudah ada dalam daftar.");
        } else if (!name) {
            alert("Nama mahasiswa tidak boleh kosong.");
        }
    });
    
    addGroupBtn.addEventListener('click', function() {
        const name = groupNameInput.value.trim();
        if (name && !groups.includes(name)) {
            groups.push(name);
            groupNameInput.value = '';
            updateGroupList();
        } else if (name && groups.includes(name)) {
            alert("Nama kelompok sudah ada dalam daftar.");
        } else if (!name) {
            alert("Nama kelompok tidak boleh kosong.");
        }
    });

    if (showBatchInputBtn) {
        showBatchInputBtn.addEventListener('click', () => batchInputModal.style.display = 'block');
    }
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => batchInputModal.style.display = 'none');
    }
    
    if (showBatchGroupInputBtn) {
        showBatchGroupInputBtn.addEventListener('click', () => batchGroupInputModal.style.display = 'block');
    }
    if (closeGroupModalBtn) {
        closeGroupModalBtn.addEventListener('click', () => batchGroupInputModal.style.display = 'none');
    }
    
    window.addEventListener('click', function(event) {
        if (event.target === batchInputModal) batchInputModal.style.display = 'none';
        if (event.target === batchGroupInputModal) batchGroupInputModal.style.display = 'none';
    });
    
    if (addBatchStudentsBtn) {
        addBatchStudentsBtn.addEventListener('click', function() {
            const batchText = batchStudentNamesInput.value.trim();
            if (batchText) {
                const namesList = batchText.split('\n').map(name => name.trim()).filter(name => name !== '');
                let addedCount = 0;
                let duplicateCount = 0;
                namesList.forEach(trimmedName => {
                    if (trimmedName && !students.includes(trimmedName)) {
                        students.push(trimmedName);
                        addedCount++;
                    } else if (trimmedName && students.includes(trimmedName)) {
                        duplicateCount++;
                    }
                });
                batchStudentNamesInput.value = '';
                batchInputModal.style.display = 'none';
                let alertMessage = "";
                if (addedCount > 0) {
                    alertMessage += `Berhasil menambahkan ${addedCount} mahasiswa baru. `;
                    updateStudentList(); updateRemainingStudents(); drawWheel();
                }
                if (duplicateCount > 0) {
                    alertMessage += `${duplicateCount} nama mahasiswa sudah ada/duplikat.`;
                }
                if (!alertMessage) {
                     alertMessage = 'Tidak ada mahasiswa baru yang valid untuk ditambahkan.';
                }
                alert(alertMessage.trim());
            }
        });
    }

    if (addBatchGroupsBtn) {
        addBatchGroupsBtn.addEventListener('click', function() {
            const batchText = batchGroupNamesInput.value.trim();
            if (batchText) {
                const groupNamesList = batchText.split('\n').map(name => name.trim()).filter(name => name !== '');
                let addedCount = 0;
                let duplicateCount = 0;
                groupNamesList.forEach(trimmedName => {
                    if (trimmedName && !groups.includes(trimmedName)) {
                        groups.push(trimmedName);
                        addedCount++;
                    } else if (trimmedName && groups.includes(trimmedName)) {
                        duplicateCount++;
                    }
                });
                batchGroupNamesInput.value = '';
                batchGroupInputModal.style.display = 'none';
                let alertMessage = "";

                if (addedCount > 0) {
                    alertMessage += `Berhasil menambahkan ${addedCount} kelompok baru. `;
                    updateGroupList();
                }
                if (duplicateCount > 0) {
                    alertMessage += `${duplicateCount} nama kelompok sudah ada/duplikat.`;
                }
                 if (!alertMessage) {
                     alertMessage = 'Tidak ada kelompok baru yang valid untuk ditambahkan.';
                }
                alert(alertMessage.trim());
            }
        });
    }
    
    function updateStudentList() {
        studentList.innerHTML = '';
        students.forEach((student, index) => {
            const li = document.createElement('li'); li.textContent = student;
            const deleteBtn = document.createElement('button'); deleteBtn.textContent = 'Hapus'; deleteBtn.className = 'delete-btn';
            deleteBtn.addEventListener('click', function() {
                const studentNameToDelete = students[index];
                students.splice(index, 1); // Hapus dari daftar utama
                
                // Hapus dari results jika sudah terbagi
                for (const groupName in results) {
                    const studentIndexInGroup = results[groupName].indexOf(studentNameToDelete);
                    if (studentIndexInGroup > -1) {
                        results[groupName].splice(studentIndexInGroup, 1);
                        if (currentSpinData.group === groupName) currentSpinData.count = results[groupName].length;
                    }
                }
                updateStudentList(); updateRemainingStudents(); updateResultsDisplay();
                if (currentSpinData.group && results[currentSpinData.group]) {
                     currentCount.textContent = `Anggota terpilih: ${results[currentSpinData.group].length}/${studentsPerGroup}`;
                } else if (currentSpinData.group) {
                     currentCount.textContent = `Anggota terpilih: 0/${studentsPerGroup}`;
                }
                drawWheel();
            });
            li.appendChild(deleteBtn); studentList.appendChild(li);
        });
    }
    
    function updateGroupList() {
        groupList.innerHTML = '';
        groups.forEach((group, index) => {
            const li = document.createElement('li'); li.textContent = group;
            const deleteBtn = document.createElement('button'); deleteBtn.textContent = 'Hapus'; deleteBtn.className = 'delete-btn';
            deleteBtn.addEventListener('click', function() {
                const groupNameToDelete = groups[index];
                groups.splice(index, 1);
                if (results[groupNameToDelete]) {
                    // Saat grup dihapus, mahasiswa di dalamnya dikembalikan ke 'remainingStudents' jika mereka masih ada di daftar 'students' global
                    // dan belum masuk ke grup lain.
                    results[groupNameToDelete].forEach(studentInDeletedGroup => {
                        if (students.includes(studentInDeletedGroup)) {
                            let isStillInAnotherGroup = false;
                            for (const gName in results) {
                                if (results[gName] && results[gName].includes(studentInDeletedGroup)) {
                                    isStillInAnotherGroup = true;
                                    break;
                                }
                            }
                            // Hanya tambahkan ke remainingStudents jika tidak lagi di grup manapun yang tersisa
                            // updateRemainingStudents() akan menangani ini secara otomatis setelah results diubah.
                        }
                    });
                    delete results[groupNameToDelete]; // Hapus grup dari hasil
                }

                if (currentSpinData.group === groupNameToDelete) {
                    currentSpinData.group = null; currentSpinData.count = 0;
                    currentGroup.textContent = 'Kelompok saat ini: -';
                    currentCount.textContent = `Anggota terpilih: 0/${studentsPerGroup}`;
                }
                updateGroupList(); 
                updateRemainingStudents(); // Penting untuk diupdate setelah 'results' dimodifikasi
                updateResultsDisplay(); 
                drawWheel();
            });
            li.appendChild(deleteBtn); groupList.appendChild(li);
        });
    }
    
    function updateRemainingStudents() {
        remainingStudents = students.filter(student => {
            for (const group in results) {
                if (results[group] && results[group].includes(student)) return false;
            }
            return true;
        });
        remainingCounter.textContent = `Sisa mahasiswa: ${remainingStudents.length}`;
    }
    
    function drawSegment(x, y, radius, startAngle, endAngle, color, text) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.translate(x, y);
        const textAngle = startAngle + (endAngle - startAngle) / 2;
        ctx.rotate(textAngle);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        const displayName = text.length > 12 ? text.substring(0, 10) + '...' : text;
        ctx.fillText(displayName, radius - 20, 5);
        ctx.restore();
    }

    function drawWheel(rotationAngle = currentSpinData.currentWheelAngle) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rotationAngle); 
        ctx.translate(-canvas.width / 2, -canvas.height / 2);

        if (remainingStudents.length === 0) {
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2 - 10, 0, 2 * Math.PI);
            ctx.fillStyle = '#f0f0f0';
            ctx.fill();
            ctx.stroke();
            ctx.font = '20px Arial';
            ctx.fillStyle = '#333';
            ctx.textAlign = 'center';
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0); 
            ctx.fillText('Tidak ada mahasiswa tersisa', canvas.width / 2, canvas.height / 2);
            ctx.restore();
        } else {
            const total = remainingStudents.length;
            const anglePerSegment = (2 * Math.PI) / total;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = Math.min(centerX, centerY) - 10;
            
            for (let i = 0; i < total; i++) {
                const startAngle = i * anglePerSegment;
                const endAngle = (i + 1) * anglePerSegment;
                drawSegment(centerX, centerY, radius, startAngle, endAngle, colors[i % colors.length], remainingStudents[i]);
            }
        }
        ctx.restore(); 
    }

    function determineSelectedIndex(finalWheelAngle, totalSegments) {
        if (totalSegments === 0) return -1; 
        const anglePerSegment = (2 * Math.PI) / totalSegments;
        let angleAtArrow = ( (3 * Math.PI / 2) - finalWheelAngle );
        angleAtArrow = (angleAtArrow % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI);
        const selectedIndex = Math.floor(angleAtArrow / anglePerSegment);
        return selectedIndex;
    }
    
    function spin() {
        if (currentSpinData.isSpinning) return;
        if (remainingStudents.length === 0) { alert('Tidak ada mahasiswa tersisa untuk di-spin!'); return; }
        
        if (!currentSpinData.group || (results[currentSpinData.group] && results[currentSpinData.group].length >= studentsPerGroup)) {
            let assignedNewGroup = false;
            for (let i = 0; i < groups.length; i++) {
                const groupName = groups[i];
                if (!results[groupName] || results[groupName].length < studentsPerGroup) {
                    currentSpinData.group = groupName;
                    currentSpinData.count = results[groupName] ? results[groupName].length : 0;
                    if (!results[currentSpinData.group]) results[currentSpinData.group] = [];
                    assignedNewGroup = true; break;
                }
            }
            if (!assignedNewGroup) {
                 if (groups.length > 0) alert('Semua kelompok yang ada sudah terisi penuh atau tidak ada yang bisa diisi.');
                 else alert('Tambahkan minimal satu kelompok terlebih dahulu!');
                 currentGroup.textContent = (groups.length > 0 && remainingStudents.length > 0) ? `Semua kelompok telah terisi` : `Kelompok saat ini: -`;
                 currentCount.textContent = `Anggota terpilih: -`; return;
            }
        }
        
        currentGroup.textContent = `Kelompok saat ini: ${currentSpinData.group}`;
        currentCount.textContent = `Anggota terpilih: ${currentSpinData.count}/${studentsPerGroup}`;

        const isCurrentGroupEffectivelyEmpty = currentSpinData.count === 0;
        if (currentSpinData.group && isCurrentGroupEffectivelyEmpty && remainingStudents.length > 0 && remainingStudents.length === studentsPerGroup) {
            results[currentSpinData.group] = [...remainingStudents]; currentSpinData.count = studentsPerGroup;
            const assignedGroupName = currentSpinData.group; remainingStudents = [];
            currentCount.textContent = `Anggota terpilih: ${currentSpinData.count}/${studentsPerGroup}`;
            updateResultsDisplay(); updateRemainingStudents(); drawWheel(); 
            alert(`Semua ${studentsPerGroup} mahasiswa sisa langsung dimasukkan ke ${assignedGroupName}.`);
            const currentGroupIndex = groups.indexOf(assignedGroupName); let nextGroupAssigned = false;
            if (currentGroupIndex < groups.length - 1) {
                for (let i = currentGroupIndex + 1; i < groups.length; i++) {
                    if (!results[groups[i]] || results[groups[i]].length < studentsPerGroup) {
                        currentSpinData.group = groups[i]; currentSpinData.count = results[groups[i]] ? results[groups[i]].length : 0;
                        if (!results[currentSpinData.group]) results[currentSpinData.group] = [];
                        nextGroupAssigned = true; break;
                    }
                }
                if (!nextGroupAssigned) currentSpinData.group = null; 
            } else { currentSpinData.group = null; }
            if (currentSpinData.group) {
                currentGroup.textContent = `Kelompok saat ini: ${currentSpinData.group}`;
                currentCount.textContent = `Anggota terpilih: ${currentSpinData.count}/${studentsPerGroup}`;
            } else {
                currentGroup.textContent = `Semua kelompok telah terisi`; currentCount.textContent = `Anggota terpilih: -`;
            }
            currentSpinData.isSpinning = false; return; 
        }
        
        if (currentSpinData.count >= studentsPerGroup) {
            alert(`Kelompok ${currentSpinData.group} sudah penuh. Silakan pilih kelompok lain (jika tersedia) atau mulai spin untuk kelompok baru.`);
            return;
        }

        currentSpinData.isSpinning = true; spinBtn.textContent = '...'; spinBtn.disabled = true;
        
        const totalSegments = remainingStudents.length;
        const baseRotations = 3 + Math.floor(Math.random() * 3); 
        const randomExtraAngle = Math.random() * (2 * Math.PI); 
        const targetRotation = (baseRotations * 2 * Math.PI) + randomExtraAngle; 
        
        const duration = 5000 + Math.random() * 2000; 
        const startTime = Date.now();
        const startAngle = currentSpinData.currentWheelAngle; 

        function animateSpin() {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 4); 
            
            currentSpinData.currentWheelAngle = startAngle + easedProgress * targetRotation;
            drawWheel(currentSpinData.currentWheelAngle); 
            
            if (progress < 1) {
                requestAnimationFrame(animateSpin);
            } else {
                currentSpinData.currentWheelAngle = (currentSpinData.currentWheelAngle % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI);
                drawWheel(currentSpinData.currentWheelAngle); 

                const actualSelectedIndex = determineSelectedIndex(currentSpinData.currentWheelAngle, totalSegments);
                
                setTimeout(() => {
                    if (actualSelectedIndex !== -1 && actualSelectedIndex < remainingStudents.length) {
                        handleSpinResult(actualSelectedIndex);
                    } else {
                        console.error("Gagal menentukan indeks valid setelah spin. Sisa mahasiswa:", remainingStudents.length, "Indeks terpilih:", actualSelectedIndex);
                        if (remainingStudents.length > 0) {
                           alert("Terjadi kesalahan pada penentuan hasil spin, mencoba memilih secara acak.");
                           handleSpinResult(Math.floor(Math.random() * remainingStudents.length)); 
                        } else {
                            currentSpinData.isSpinning = false;
                            spinBtn.textContent = 'SPIN';
                            spinBtn.disabled = false;
                        }
                    }
                }, 200); 
            }
        }
        animateSpin();
    }
    
    function handleSpinResult(selectedIndexOnWheel) {
        if (remainingStudents.length === 0 || selectedIndexOnWheel < 0 || selectedIndexOnWheel >= remainingStudents.length) {
            console.error("Error di handleSpinResult: Tidak ada sisa mahasiswa atau indeks tidak valid.", selectedIndexOnWheel, remainingStudents.length);
            currentSpinData.isSpinning = false; spinBtn.textContent = 'SPIN'; spinBtn.disabled = false;
            return;
        }
        const selectedStudent = remainingStudents[selectedIndexOnWheel];
        
        if (!currentSpinData.group) {
            alert("Kesalahan: Tidak ada kelompok aktif untuk menampung mahasiswa. Silakan pilih atau buat kelompok.");
            currentSpinData.isSpinning = false; spinBtn.textContent = 'SPIN'; spinBtn.disabled = false;
            return;
        }

        if (!results[currentSpinData.group]) results[currentSpinData.group] = [];
        
        results[currentSpinData.group].push(selectedStudent);
        currentSpinData.count = results[currentSpinData.group].length;
        currentCount.textContent = `Anggota terpilih: ${currentSpinData.count}/${studentsPerGroup}`;
        
        updateResultsDisplay();
        updateRemainingStudents(); 
        
        if (currentSpinData.count >= studentsPerGroup) {
            const currentGroupIndex = groups.indexOf(currentSpinData.group); let nextGroupAssigned = false;
            if (currentGroupIndex < groups.length - 1) {
                for (let i = currentGroupIndex + 1; i < groups.length; i++) {
                    if (!results[groups[i]] || results[groups[i]].length < studentsPerGroup) {
                        currentSpinData.group = groups[i]; currentSpinData.count = results[groups[i]] ? results[groups[i]].length : 0;
                        if (!results[currentSpinData.group]) results[currentSpinData.group] = [];
                        nextGroupAssigned = true; break;
                    }
                }
                 if (!nextGroupAssigned) currentSpinData.group = null; 
            } else { currentSpinData.group = null; }
            
            if (currentSpinData.group) {
                currentGroup.textContent = `Kelompok saat ini: ${currentSpinData.group}`;
                currentCount.textContent = `Anggota terpilih: ${currentSpinData.count}/${studentsPerGroup}`;
            } else {
                currentGroup.textContent = `Semua kelompok telah terisi`; currentCount.textContent = `Anggota terpilih: -`;
            }
        }
        
        currentSpinData.isSpinning = false; spinBtn.textContent = 'SPIN'; spinBtn.disabled = false;
    }
    
    function updateResultsDisplay() {
        let displayText = '';
        for (const group in results) {
            if (results[group] && results[group].length > 0) { // Pastikan results[group] ada
                displayText += `=== ${group} ===\n`;
                results[group].forEach((student, index) => { displayText += `${index + 1}. ${student}\n`; });
                displayText += '\n';
            }
        }
        resultBox.textContent = displayText;
    }
    
    // FUNGSI RESET YANG DIPERBARUI
    function resetResults() {
        let hasResultsToClear = false;
        for (const groupName in results) {
            if (results[groupName] && results[groupName].length > 0) {
                hasResultsToClear = true;
                break;
            }
        }

        if (!hasResultsToClear) {
            alert('Belum ada hasil pembagian kelompok untuk direset.');
            return;
        }
        
        if (confirm('Anda yakin ingin mereset hasil pembagian kelompok? Daftar mahasiswa dan kelompok yang sudah diinput akan TETAP ADA.')) {
            results = {}; // Hanya reset hasil pembagian kelompok
            
            // Reset data spin saat ini dan state UI terkait
            currentSpinData.group = null;
            currentSpinData.count = 0;
            currentSpinData.currentWheelAngle = 0; // Reset sudut roda agar tampilan konsisten
            currentSpinData.isSpinning = false;

            updateRemainingStudents(); // Ini akan mengisi ulang remainingStudents dari daftar students utama karena results kosong
            updateResultsDisplay(); // Ini akan mengosongkan resultBox
            
            currentGroup.textContent = 'Kelompok saat ini: -';
            currentCount.textContent = `Anggota terpilih: 0/${studentsPerGroup}`;
            // remainingCounter akan diupdate oleh updateRemainingStudents()

            drawWheel(); // Gambar ulang roda dengan semua mahasiswa dan sudut roda reset
            spinBtn.textContent = 'SPIN';
            spinBtn.disabled = false;
            
            alert('Hasil pembagian kelompok telah direset. Semua mahasiswa kembali tersedia untuk diputar.');
        }
    }
    
    function downloadResults() {
        let hasResults = false; for (const group in results) if (results[group] && results[group].length > 0) { hasResults = true; break; }
        if (!hasResults) { alert('Belum ada hasil pembagian kelompok untuk didownload!'); return; }
        let content = 'HASIL PEMBAGIAN KELOMPOK\n'; content += `Generated pada: ${new Date().toLocaleString()}\n\n`;
        for (const group in results) {
             if (results[group] && results[group].length > 0) {
                content += `=== ${group} ===\n`;
                results[group].forEach((student, index) => { content += `${index + 1}. ${student}\n`; });
                content += '\n';
            }
        }
        content += 'STATISTIK PEMBAGIAN:\n'; content += `Total mahasiswa terdaftar: ${students.length}\n`;
        content += `Total kelompok terdaftar: ${groups.length}\n`; content += `Target mahasiswa per kelompok: ${studentsPerGroup}\n`;
        let assignedStudentsCount = 0; for (const group in results) { if(results[group]) assignedStudentsCount += results[group].length; }
        content += `Total mahasiswa terbagi: ${assignedStudentsCount}\n`; content += `Sisa mahasiswa belum terbagi: ${remainingStudents.length}\n\n`;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'hasil_pembagian_kelompok.txt';
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    }
    
    spinBtn.addEventListener('click', spin);
    resetBtn.addEventListener('click', resetResults); // Menggunakan fungsi reset yang baru
    downloadBtn.addEventListener('click', downloadResults);
    
    studentNameInput.addEventListener('keypress', e => { if (e.key === 'Enter') addStudentBtn.click(); });
    groupNameInput.addEventListener('keypress', e => { if (e.key === 'Enter') addGroupBtn.click(); });
    
    // Initialize
    updateRemainingStudents(); 
    drawWheel(); 
    maxPerGroupDisplay.textContent = studentsPerGroup;
});
