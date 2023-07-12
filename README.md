# Structure

All of the website files are located in the s3 folder, which should be put in an S3 bucket

There is one lambda function here, that will generate a new index.html based on all of the markdown files in the markdown directory of the s3 bucket you create

![markdown files are fed into the lambda, which generates the index.html file](flow.png)