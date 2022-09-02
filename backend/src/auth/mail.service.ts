import { Injectable } from "@nestjs/common";
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MyMailService {

    constructor(private readonly mailerService: MailerService,
                private readonly configService: ConfigService){}

    async sendActivationMail(to, link) {
        this.mailerService.sendMail({
            from: this.configService.get('EMAIL_ADRESS'),
            to,
            replyTo: this.configService.get('EMAIL_ADRESS'),
            subject: "Account activation from " + this.configService.get('BACKEND_URL'),
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

