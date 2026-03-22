FROM ubuntu:focal

# update packages
RUN apt-get update 
# api calls cli tool
RUN apt-get install -y curl
# install nodejs
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get upgrade -y
RUN apt-get install -y nodejs
RUN apt-get install git -y

WORKDIR /home/app
COPY main.sh main.sh
COPY script.js script.js
COPY package*.json .

RUN npm install

# get executable permission
RUN chmod +x main.sh
RUN chmod +x script.js


ENTRYPOINT [ "/home/app/main.sh" ]