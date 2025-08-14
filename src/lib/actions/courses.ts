
import type { Course, ApiCourseResponse, Batch, ParentCourse } from '../types';

const QA_API_BASE_URL = process.env.NEXT_PUBLIC_LMS_SERVER_URL || 'https://qa-api.pharmacollege.lk';

export const getCourses = async (): Promise<Course[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/course`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch courses' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    const apiResponse: ApiCourseResponse = await response.json();

    return Object.values(apiResponse).map(courseDetails => ({
        id: courseDetails.id,
        name: courseDetails.course_name,
        courseCode: courseDetails.course_code,
    }));
};

export const getBatches = async (): Promise<Batch[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/course`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch courses' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    const apiResponse: ApiCourseResponse = await response.json();

    return Object.values(apiResponse).map(courseDetails => ({
        id: courseDetails.id,
        name: courseDetails.course_name,
        parent_course_id: courseDetails.parent_course_id,
        courseCode: courseDetails.course_code,
        description: courseDetails.course_description,
        duration: courseDetails.course_duration,
        fee: courseDetails.course_fee,
        registration_fee: courseDetails.registration_fee,
        enroll_key: courseDetails.enroll_key,
        course_img: courseDetails.course_img,
        certification: courseDetails.certification,
        mini_description: courseDetails.mini_description,
    }));
};

export const createBatch = async (batchData: Omit<Batch, 'id'>): Promise<Batch> => {
     const payload = {
        course_name: batchData.name,
        parent_course_id: batchData.parent_course_id,
        course_code: batchData.courseCode,
        course_description: batchData.description,
        course_duration: batchData.duration,
        course_fee: batchData.fee,
        registration_fee: batchData.registration_fee,
        enroll_key: batchData.enroll_key,
        course_img: batchData.course_img,
        certification: batchData.certification,
        mini_description: batchData.mini_description,
    };
    const response = await fetch(`${QA_API_BASE_URL}/course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to create batch');
    return response.json();
};

export const updateBatch = async (id: string, batchData: Partial<Omit<Batch, 'id'>>): Promise<Batch> => {
    const payload = {
        course_name: batchData.name,
        parent_course_id: batchData.parent_course_id,
        course_code: batchData.courseCode,
        course_description: batchData.description,
        course_duration: batchData.duration,
        course_fee: batchData.fee,
        registration_fee: batchData.registration_fee,
        enroll_key: batchData.enroll_key,
        course_img: batchData.course_img,
        certification: batchData.certification,
        mini_description: batchData.mini_description,
    };
    const response = await fetch(`${QA_API_BASE_URL}/course/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to update batch');
    return response.json();
};

export const deleteBatch = async (id: string): Promise<void> => {
    const response = await fetch(`${QA_API_BASE_URL}/course/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete batch');
};

// Parent Course API functions
export const getParentCourseList = async (): Promise<ParentCourse[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/parent-main-course`);
    if (!response.ok) throw new Error('Failed to fetch parent course list');
    return response.json();
}

export const getParentCourses = async (): Promise<ParentCourse[]> => {
    const response = await fetch(`${QA_API_BASE_URL}/parent-main-course`);
     if (!response.ok) {
        throw new Error('Failed to fetch parent courses');
    }
    return response.json();
}

export const getParentCourse = async (id: string): Promise<ParentCourse> => {
    const response = await fetch(`${QA_API_BASE_URL}/parent-main-course/${id}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch course' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const createParentCourse = async (courseData: Omit<ParentCourse, 'id'>): Promise<ParentCourse> => {
    const response = await fetch(`${QA_API_BASE_URL}/parent-main-course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create parent course.' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const updateParentCourse = async (id: string, courseData: Partial<Omit<ParentCourse, 'id'>>): Promise<ParentCourse> => {
    const response = await fetch(`${QA_API_BASE_URL}/parent-main-course/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
    });
     if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update parent course.' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const deleteParentCourse = async (id: string): Promise<void> => {
    const response = await fetch(`${QA_API_BASE_URL}/parent-main-course/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete parent course.' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
};
