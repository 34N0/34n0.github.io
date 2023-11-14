---
layout: base
title: sending e-mails from deployed docker container using a postfix service running on host
tags: post
meta:
  keywords: postfix, docker, phpmail, email, container, dokku, ubuntu, host
date: 2023-11-13
link: ..
templateEngineOverride: md, njk
---
{% import "code.njk" as code %}

## intro

Sending emails from containerized applicactions, for instance from a contact form within a php web application, can be difficult. While self-hosting my own web applications, i've found one elegant solution to set up Postfix as a "send-only" SMTP server running on the host. and connecting to it from the containers through dockers virtual bridge network.

## setup

This tutorial assumes you are running a Server on Ubuntu 22.04 and have docker installed. For this tutorial to work you need to have a domain pointing ot your server and have it setup as hostname.

### Install Postfix

First we will install Postfix.

{{ code.snippet('
sudo apt install mailutils
') }}

In the configuration Window select "internet Site". Type your hostname as system mail name.

## Postfix configuration

Open the configuration file:

{{ code.snippet('
sudo nano /etc/postfix/main.cf
') }}

the configuration option 'inet_interfaces' specifies the network interfacea ddresses from which this server receives mail from. On this server we only want to send email addresses. so we set the option to 'loopback_only'.

{{ code.snippet('
inet_interfaces = loopback-only
') }}

Since we want to receive connections from docker containers we need to specifiy the possible ip ranges in the 'mynetworks' setting.

on my server all docker containers are in the same bridge network. The host's ip address in the network is 172.17.0.1. To allow connections from all docker containers i edited the setting to:

{{ code.snippet('
mynetworks = 172.17.0.0/24 127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128
') }}

Now if you connect from the docker containers to the 25 port on the host (172.17.0.1) you should be able to send emails through the Postfix server.

## encryption

Since we do not receive any mails, we do not need to configure any certificate. All we have to do is configure Postfix to use outbound TLS. 

The best practise for this is to use opportunistic 'DANE'. At this security level, the TLS policy for the destination is obtained via DNSSEC. If the TLSA records are not found or unusable, this setting reverts back to 'encrypt'.

Set these settings in the 'main.cfg' file. You can delete all the other TLS settings.

{{ code.snippet('
# TLS, DNSSEC and DANE for SMTP client
smtp_tls_session_cache_database = btree:${data_directory}/smtp_scache
smtp_tls_security_level = dane
smtp_dns_support_level = dnssec
') }}

Restart the Postfix service to load the configuration:

{{ code.snippet('
sudo systemctl restart postfix.service
') }}

## test

Since we installed the 'mailutils' package we can test the server by sending an email using:

{{ code.snippet('
echo "This is the body of an encrypted email" | mail -s "This is the subject line" <your_email_address>
') }}

Make sure to view the source of the received email and check if TLS is used in the initial connection.