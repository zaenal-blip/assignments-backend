import { sendEmailNotification } from '../../lib/mail.js';
import dotenv from 'dotenv';

dotenv.config();

const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5173';

export interface UserData {
  id: number;
  name: string;
  noHp: string;
  email: string;
}

export interface TaskData {
  id: number;
  name: string;
}

export interface ProjectData {
  id: number;
  name: string;
}

export interface EventData {
  id: number;
  name: string;
}

/**
 * NotificationService
 * Responsible for formatting and sending Email notifications for different system events.
 */
export class NotificationService {
  /**
   * 1. Send notification when a user is assigned to a Task
   */
  static async sendTaskAssignmentNotification(
    user: UserData,
    task: TaskData,
    project: ProjectData | null,
    assignerName: string
  ) {
    const projectName = project ? project.name : 'N/A';
    
    const message = `You have been assigned to a task.

Task: ${task.name}
Project: ${projectName}
Assigned by: ${assignerName}

Please check your assignment:
${APP_BASE_URL}/personal-job`;

    // Email Notification
    if (user.email) {
      const subject = `Task Assignment: ${task.name}`;
      await sendEmailNotification(user.email, subject, message);
    }
  }

  /**
   * 2. Send notification when a user is assigned to a Project
   */
  static async sendProjectAssignmentNotification(
    user: UserData,
    project: ProjectData
  ) {
    const message = `You have been assigned to a project.

Project: ${project.name}
Role: PIC

Check details:
${APP_BASE_URL}/projects/${project.id}`;

    // Email Notification
    if (user.email) {
      const subject = `Project Assignment: ${project.name}`;
      await sendEmailNotification(user.email, subject, message);
    }
  }

  /**
   * 3. Send notification when a user is assigned to an Event
   */
  static async sendEventAssignmentNotification(
    user: UserData,
    event: EventData,
    project: ProjectData | null
  ) {
    const projectName = project ? project.name : 'N/A';

    const message = `You have been assigned to an event.

Event: ${event.name}
Project: ${projectName}

Check details:
${APP_BASE_URL}/events/${event.id}`;

    // Email Notification
    if (user.email) {
      const subject = `Event Assignment: ${event.name}`;
      await sendEmailNotification(user.email, subject, message);
    }
  }
}
