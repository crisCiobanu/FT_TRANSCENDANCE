import { Injectable } from "@nestjs/common";
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MyMailService {

    constructor(private readonly mailerService: MailerService){}

    async sendActivationMail(to, link) {
        this.mailerService.sendMail({
            from: 'fourtytwotranscendence@zohomail.eu',
            to,
            replyTo: 'fourtytwotranscendence@zohomail.eu',
            subject: "Account activation from " + process.env.BACKEND_URL,
            text: '',
            html: 
                `
                <div>
                    <h1>This is your activation code</h1>
                    <h2>${link}</h2>
                </div>
                `
        })
    }
}

