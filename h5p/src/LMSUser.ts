import { IUser } from '@lumieducation/h5p-server';

/**
 * Simple user object identified only by ID
 * Users are created automatically when they access the system
 */
export default class LMSUser implements IUser {
    constructor(public id: string) {
        this.name = `User ${id}`;
        this.email = '';
        this.type = 'local';
    }


    public name: string;
    public email: string;
    public type: 'local';
}

