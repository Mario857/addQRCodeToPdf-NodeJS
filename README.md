## Add QR Code to PDF documents

Usage

1. Install node modules

```
npm install
```

2. Run application
```
npm run start
```


3. Application is running on port 4000

```
URL : http://localhost:4000/addQrToPdf
Method : POST
Content Type : multipart/form-data

file: File // PDF file you want to upload
width: NumberString! // QR Code width
height: NumberString! // QR Code height
x: NumberString! // QR Code placement left to right
y: NumberString! // QR Code placement top to bottom
qrCodeData: String! // QR Code data (data you want to be stored in qr code)
qrDarkColor: String // QR Code data color
qrLightColor: String // QR Code background
```
