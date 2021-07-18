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

```
3. Application is running on port 4000
```

```
URL : http://localhost:4000/addQrToPdf
Method : POST
Content Type : multipart/form-data

file: File
width: NumberString!
height: NumberString!
x: NumberString!
y: NumberString!
qrCodeData: String!
qrDarkColor: String
qrLightColor: String
```
