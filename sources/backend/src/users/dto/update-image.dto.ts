export class UpdateUserImageDto{
    id: number;
    imageURL : string;
}

export class UploadImageDto{
    path: string;
    filename: string;
    mimetype: string;
}