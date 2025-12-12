

import type { StudentSearchResult, UserFullDetails, ApiStaffMember, StaffMember, StudentEnrollmentInfo, TempUser, StudentBalanceData, GamePatient, Course } from '../types';

const QA_API_BASE_URL = process.env.NEXT_PUBLIC_LMS_SERVER_URL || 'https://qa-api.pharmacollege.lk';

// Student Search
export const searchStudents = async (query: string): Promise<StudentSearchResult[]> => {
    if (!query) return Promise.resolve([]);
    const response = await fetch(`${QA_API_BASE_URL}/student-search-new/${encodeURIComponent(query)}`);
    if (!response.ok) {
        throw new Error('Failed to search students');
    }
    return response.json();
};

export const getPatient = async (studentId: string, courseCode: string): Promise<GamePatient> => {
    const response = await fetch(`${QA_API_BASE_URL}/care-center-courses/student/${studentId}/course/${courseCode}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch game prescriptions' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    const data = await response.json();
    return data[0];
};

export const getAllUserFullDetails = async (): Promise<UserFullDetails[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/userFullDetails`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch user details' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
}

export const getAllStudents = async (): Promise<ApiStaffMember[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/users`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch students' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    const users = await response.json();
    return users.filter((user: any) => user.userlevel === 'Student');
};

const mapApiStaffToStaffMember = (apiStaff: ApiStaffMember): StaffMember => ({
  id: apiStaff.id,
  name: `${apiStaff.fname} ${apiStaff.lname}`,
  username: apiStaff.username,
  email: apiStaff.email,
  avatar: `https://placehold.co/40x40.png?text=${apiStaff.fname[0]}${apiStaff.lname[0]}`,
});

export const getStaffMembers = async (): Promise<StaffMember[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/users/staff/`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch staff members' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    const apiStaffList: ApiStaffMember[] = await response.json();
    return apiStaffList.map(mapApiStaffToStaffMember);
};

export const getStudentFullInfo = async (studentNumber: string): Promise<any> => {
    const response = await fetch(`${QA_API_BASE_URL}/get-student-full-info?loggedUser=${studentNumber.trim().toUpperCase()}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Student full info not found for ${studentNumber}` }));
        throw new Error(errorData.message || 'Failed to fetch student full info');
    }
    const data = await response.json();
    if (!data.studentInfo || !data.studentEnrollments || !data.studentBalance) {
        throw new Error('Incomplete student data received from API');
    }
    return data;
};

export const getStudentEnrollments = async (studentNumber: string): Promise<StudentEnrollmentInfo[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/student-courses-new/student-number/${studentNumber}`);
    if (response.status === 404) {
        return [];
    }
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch enrollments for ${studentNumber}`}));
        throw new Error(errorData.message || 'Failed to fetch enrollments');
    }
    return response.json();
};

export const addStudentEnrollment = async (data: { student_id: string; course_code: string }): Promise<any> => {
    const payload = {
        student_id: data.student_id,
        course_code: data.course_code,
        enrollment_key: 'ForceAdmin',
        created_at: new Date().toISOString(),
    };
    const response = await fetch(`${QA_API_BASE_URL}/student-courses-new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to add enrollment' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const removeStudentEnrollment = async (studentCourseId: string): Promise<any> => {
    const response = await fetch(`${QA_API_BASE_URL}/student-courses-new/${studentCourseId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to remove enrollment' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const getStudentDetailsByUsername = async (username: string): Promise<UserFullDetails> => {
    const response = await fetch(`${QA_API_BASE_URL}/userFullDetails/username/${username}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch student details for ${username}` }));
        throw new Error(errorData.message || 'Failed to fetch student details');
    }
    return response.json();
};

export const getTempUserDetailsById = async (id: string): Promise<TempUser> => {
    const response = await fetch(`${QA_API_BASE_URL}/temp-users/${id}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch temp user details for ID ${id}` }));
        throw new Error(errorData.message || 'Failed to fetch temp user details');
    }
    return response.json();
};

export const getStudentBalance = async (studentNumber: string): Promise<StudentBalanceData> => {
    const response = await fetch(`${QA_API_BASE_URL}/get-student-balance?loggedUser=${studentNumber}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch student balance for ${studentNumber}`}));
        throw new Error(errorData.message || 'Failed to fetch student balance');
    }
    return response.json();
}

