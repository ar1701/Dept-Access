// Global variables
let currentPage = 1;
const pageSize = 10;
let allRows = [];
let originalOrder = []; // To store the original order of rows

// Get DOM elements
const yearFilter = document.getElementById("yearFilter");
const semesterFilter = document.getElementById("semesterFilter");
const feeFilter = document.getElementById("feeFilter");
const verifiedFilter = document.getElementById("verifiedFilter");
const searchInput = document.getElementById("searchInput");
const sortOption = document.getElementById("sortOption");
const dataBody = document.getElementById("dataBody");
const paginationElement = document.getElementById("pagination");

// Event delegation for pagination clicks
paginationElement.addEventListener("click", function (e) {
  // Check if clicked element is a page link
  if (e.target && e.target.classList.contains("page-link")) {
    e.preventDefault();

    // Get the parent li element
    const parentLi = e.target.closest("li");

    // Don't do anything if the item is disabled
    if (parentLi.classList.contains("disabled")) {
      return false;
    }

    // Check what kind of button was clicked
    if (e.target.textContent === "Previous") {
      if (currentPage > 1) {
        currentPage--;
        showPage(currentPage);
      }
    } else if (e.target.textContent === "Next") {
      const visibleRows = allRows.filter(
        (row) => row.dataset.visible !== "false"
      );
      const totalPages = Math.ceil(visibleRows.length / pageSize);

      if (currentPage < totalPages) {
        currentPage++;
        showPage(currentPage);
      }
    } else {
      // Must be a page number
      currentPage = parseInt(e.target.textContent);
      showPage(currentPage);
    }

    return false;
  }
});

// Function to update pagination controls
function updatePagination() {
  const visibleRows = allRows.filter((row) => row.dataset.visible !== "false");
  const totalPages = Math.ceil(visibleRows.length / pageSize);

  // Clear existing pagination
  paginationElement.innerHTML = "";

  // Previous button
  const prevLi = document.createElement("li");
  prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
  prevLi.innerHTML = `<a class="page-link" href="#">Previous</a>`;
  paginationElement.appendChild(prevLi);

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement("li");
    li.className = `page-item ${currentPage === i ? "active" : ""}`;
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    paginationElement.appendChild(li);
  }

  // Next button
  const nextLi = document.createElement("li");
  nextLi.className = `page-item ${
    currentPage === totalPages || totalPages === 0 ? "disabled" : ""
  }`;
  nextLi.innerHTML = `<a class="page-link" href="#">Next</a>`;
  paginationElement.appendChild(nextLi);
}

// Function to show specific page
function showPage(page) {
  const visibleRows = allRows.filter((row) => row.dataset.visible !== "false");
  const totalPages = Math.ceil(visibleRows.length / pageSize);

  // Validate page number
  if (page < 1) page = 1;
  if (totalPages > 0 && page > totalPages) page = totalPages;

  currentPage = page;

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;

  // Hide all rows first
  allRows.forEach((row) => (row.style.display = "none"));

  // Show only rows for current page
  visibleRows.forEach((row, index) => {
    if (index >= start && index < end) {
      row.style.display = "";
    }
  });

  updatePagination();
}

// Function to filter table data
function filterTable() {
  const yearValue = yearFilter.value;
  const semesterValue = semesterFilter.value;
  const feeValue = feeFilter.value;
  const verifiedValue = verifiedFilter.value;
  const searchValue = searchInput.value.toLowerCase();

  allRows.forEach((row) => {
    const year = String(row.dataset.year);
    const semester = String(row.dataset.semester);
    const feeDue = String(row.dataset.feeDue);
    const verified = String(row.dataset.verified);

    // Get the name and registration number from the table cells
    const name = row.cells[0].textContent.toLowerCase();
    const regNo = row.cells[1].textContent.toLowerCase();

    const matchesYear = !yearValue || year === yearValue;
    const matchesSemester = !semesterValue || semester === semesterValue;
    const matchesFee = !feeValue || feeDue === feeValue;
    const matchesVerified = !verifiedValue || verified === verifiedValue;

    // Check if the search term matches either name OR registration number
    const matchesSearch =
      !searchValue || name.includes(searchValue) || regNo.includes(searchValue);

    // Mark rows as visible or not for pagination
    if (
      matchesYear &&
      matchesSemester &&
      matchesFee &&
      matchesVerified &&
      matchesSearch
    ) {
      row.dataset.visible = "true";
    } else {
      row.dataset.visible = "false";
    }
  });

  // Apply sorting
  sortRows();

  // Reset to first page
  currentPage = 1;
  showPage(1);
}

// Function to sort rows based on selected option
function sortRows() {
  const sortValue = sortOption.value;
  const tbody = document.getElementById("dataBody");
  const rows = Array.from(tbody.querySelectorAll("tr[data-visible='true']"));

  // Remove all rows
  rows.forEach((row) => row.remove());

  if (sortValue === "default") {
    // Restore original order
    originalOrder.forEach((row) => {
      if (row.dataset.visible === "true") {
        tbody.appendChild(row);
      }
    });
  } else if (sortValue === "name") {
    // Sort by name (A-Z)
    rows.sort((a, b) => {
      const nameA = a.cells[0].textContent.toLowerCase();
      const nameB = b.cells[0].textContent.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    // Add sorted rows back to the table
    rows.forEach((row) => tbody.appendChild(row));
  } else if (sortValue === "nameDesc") {
    // Sort by name (Z-A)
    rows.sort((a, b) => {
      const nameA = a.cells[0].textContent.toLowerCase();
      const nameB = b.cells[0].textContent.toLowerCase();
      return nameB.localeCompare(nameA);
    });

    // Add sorted rows back to the table
    rows.forEach((row) => tbody.appendChild(row));
  }

  // Update allRows to reflect the new order
  allRows = Array.from(document.querySelectorAll("#dataBody tr"));
}

// Show all details of a student
function showAllDetails(id) {
  const row = document.querySelector(`tr[data-id="${id}"]`);
  const student = {
    name: row.cells[0].textContent,
    registrationNumber: row.cells[1].textContent,
    email: row.dataset.email,
    phone: row.dataset.phone,
    branch: row.dataset.branch,
    semester: row.dataset.semester,
    yearOfAdmission: row.dataset.year,
    lastSemGPA: row.dataset.gpa,
    cgpa: row.dataset.cgpa,
    backlog: row.dataset.backlog,
    feeDue: row.dataset.feeDue,
    fatherName: row.dataset.father,
    verified: row.dataset.verified,
  };

  const detailsHtml = `
    <div class="text-start">
      <p><strong>Name:</strong> ${student.name}</p>
      <p><strong>Email:</strong> ${student.email}</p>
      <p><strong>Phone:</strong> ${student.phone}</p>
      <p><strong>Registration Number:</strong> ${student.registrationNumber}</p>
      <p><strong>Branch:</strong> ${student.branch}</p>
      <p><strong>Semester:</strong> ${student.semester}</p>
      <p><strong>Year of Admission:</strong> ${student.yearOfAdmission}</p>
      <p><strong>Last Semester GPA:</strong> ${student.lastSemGPA}</p>
      <p><strong>CGPA:</strong> ${student.cgpa}</p>
      <p><strong>Backlogs:</strong> ${student.backlog}</p>
      <p><strong>Fee Due:</strong> ${student.feeDue}</p>
      <p><strong>Father's Name:</strong> ${student.fatherName}</p>
      <p><strong>Verified:</strong> ${student.verified}</p>
    </div>
  `;

  Swal.fire({
    title: "Student Details",
    html: detailsHtml,
    confirmButtonColor: "#4f46e5",
  });
}

// Delete a student
async function deleteStudent(id, branch) {
  try {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      const response = await fetch(`/students/${branch}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");

      document.querySelector(`tr[data-id="${id}"]`).remove();
      Swal.fire("Deleted!", "Student record has been deleted.", "success");

      // Refresh rows and pagination after deletion
      allRows = Array.from(document.querySelectorAll("#dataBody tr"));
      filterTable();
    }
  } catch (error) {
    Swal.fire("Error!", error.message, "error");
  }
}

// Update the editStudent function to include dynamic year dropdown
async function editStudent(id, branch) {
  try {
    const response = await fetch(`/students/${branch}/${id}`);
    const student = await response.json();

    // Get current year for the year dropdown
    const currentYear = new Date().getFullYear();
    const yearOptions = [];
    for (let y = 2020; y <= currentYear; y++) {
      yearOptions.push(
        `<option value="${y}" ${
          student.yearOfAdmission == y ? "selected" : ""
        }>${y}</option>`
      );
    }

    const formHtml = `
      <form id="editForm" class="text-start">
        <div class="mb-3">
          <label class="form-label">Name</label>
          <input type="text" id="editName" class="form-control" value="${
            student.name
          }" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" id="editEmail" value="${
            student.email
          }" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Phone</label>
          <input type="tel" class="form-control" id="editPhone" value="${
            student.phone
          }" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Registration Number</label>
          <input type="text" class="form-control" id="editRegNo" value="${
            student.registrationNumber
          }" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Semester</label>
          <select class="form-select" id="editSemester">
            ${[...Array(8).keys()]
              .map(
                (i) => `
              <option value="${i + 1}" ${
                  i + 1 == student.semester ? "selected" : ""
                }>${i + 1}</option>
            `
              )
              .join("")}
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Year of Admission</label>
          <select id="editYear" class="form-select" required>
            ${yearOptions.join("")}
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Last Semester GPA</label>
          <input type="number" step="0.01" class="form-control" id="editGPA" value="${
            student.lastSemGPA
          }" required>
        </div>
        <div class="mb-3">
          <label class="form-label">CGPA</label>
          <input type="number" step="0.01" class="form-control" id="editCGPA" value="${
            student.cgpa
          }" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Number of Backlogs</label>
          <input type="number" min="0" class="form-control" id="editBacklog" value="${
            student.backlog
          }" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Fee Due</label>
          <select class="form-select" id="editFeeDue">
            <option value="Yes" ${
              student.feeDue === "Yes" ? "selected" : ""
            }>Yes</option>
            <option value="No" ${
              student.feeDue === "No" ? "selected" : ""
            }>No</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Father's Name</label>
          <input type="text" class="form-control" id="editFather" value="${
            student.fatherName
          }" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Verified</label>
          <select class="form-select" id="editVerified">
            <option value="Yes" ${
              student.verified === "Yes" ? "selected" : ""
            }>Yes</option>
            <option value="No" ${
              student.verified === "No" ? "selected" : ""
            }>No</option>
          </select>
        </div>
      </form>
    `;

    const { value: formData } = await Swal.fire({
      title: "Edit Student",
      html: formHtml,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#64748b",
      preConfirm: () => {
        return {
          name: document.getElementById("editName").value,
          email: document.getElementById("editEmail").value,
          phone: document.getElementById("editPhone").value,
          registrationNumber: document.getElementById("editRegNo").value,
          semester: document.getElementById("editSemester").value,
          yearOfAdmission: document.getElementById("editYear").value,
          lastSemGPA: document.getElementById("editGPA").value,
          cgpa: document.getElementById("editCGPA").value,
          backlog: document.getElementById("editBacklog").value,
          feeDue: document.getElementById("editFeeDue").value,
          fatherName: document.getElementById("editFather").value,
          verified: document.getElementById("editVerified").value,
        };
      },
    });

    if (formData) {
      // Show loading state
      Swal.fire({
        title: "Updating...",
        text: "Please wait while we update the student record",
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await fetch(`/students/${branch}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Update failed");

      // Show success notification
      const toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener("mouseenter", Swal.stopTimer);
          toast.addEventListener("mouseleave", Swal.resumeTimer);
        },
      });

      await toast.fire({
        icon: "success",
        title: "Student record updated successfully!",
      });

      location.reload();
    }
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Update Failed",
      text: error.message,
      confirmButtonColor: "#4f46e5",
    });
  }
}

// Add this function to handle verified status updates
async function updateVerifiedStatus(selectElement, studentId, branch) {
  try {
    const newStatus = selectElement.value;
    selectElement.disabled = true;

    // Show loading state
    const loadingToast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    loadingToast.fire({
      title: "Updating verification status...",
    });

    const response = await fetch(`/students/${branch}/${studentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        verified: newStatus,
      }),
    });

    if (!response.ok) throw new Error("Failed to update verification status");

    // Show success notification
    const toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });

    await toast.fire({
      icon: "success",
      title: `Verification status updated to ${newStatus}`,
    });

    selectElement.closest("tr").dataset.verified = newStatus;
    filterTable();
  } catch (error) {
    // Show error notification
    Swal.fire({
      icon: "error",
      title: "Update Failed",
      text: error.message,
      confirmButtonColor: "#4f46e5",
    });

    // Revert the select to its previous value
    selectElement.value = selectElement.closest("tr").dataset.verified;
  } finally {
    selectElement.disabled = false;
  }
}

// Add reset filters function
function resetFilters() {
  // Reset all filter inputs
  yearFilter.value = "";
  semesterFilter.value = "";
  feeFilter.value = "";
  verifiedFilter.value = "";
  searchInput.value = "";
  sortOption.value = "default"; // Reset sort option too

  // Show success notification
  const toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
  });

  toast.fire({
    icon: "success",
    title: "Filters have been reset",
  });

  // Re-filter the table
  filterTable();
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
  // Initialize allRows
  allRows = Array.from(document.querySelectorAll("#dataBody tr"));

  // Store the original order of rows
  originalOrder = [...allRows];

  // Mark all rows as visible initially
  allRows.forEach((row) => (row.dataset.visible = "true"));

  // Initial page display
  showPage(1);

  // Add event listeners for filters
  yearFilter.addEventListener("change", filterTable);
  semesterFilter.addEventListener("change", filterTable);
  feeFilter.addEventListener("change", filterTable);
  verifiedFilter.addEventListener("change", filterTable);
  searchInput.addEventListener("input", filterTable);
  sortOption.addEventListener("change", filterTable);
});
