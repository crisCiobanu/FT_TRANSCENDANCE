import { Injectable } from '@nestjs/common';
import { Twilio } from 'twilio';
import { UsersService } from '../users/users.service';
 
@Injectable()
export default class SmsService {
  private twilioClient: Twilio;
 
  constructor(
    private readonly userService: UsersService
  ) {
    const accountSid = 'AC9e4432d85e52cc24ec7a9048d849750f';
    const authToken = '71971a551aacc34151f850ccbea67524';
 
    this.twilioClient = new Twilio(accountSid, authToken);
  }

  initiatePhoneNumberVerification(phoneNumber: string) {
    const serviceSid = 'MG4278693f4c15345ad269b1c922dde870';
 
    return this.twilioClient.verify.services(serviceSid)
      .verifications
      .create({ to: phoneNumber, channel: 'sms' })
}
}