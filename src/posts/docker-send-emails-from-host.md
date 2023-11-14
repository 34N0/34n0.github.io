---
layout: base
title: 📨 sending e-mails from deployed docker container using a postfix service running on host
tags: post
meta:
  keywords: postfix, docker, phpmail, email, container, dokku, ubuntu, host
date: 2023-11-13
link: ..
templateEngineOverride: md, njk
---
{% import "code.njk" as code %}

<b>📆 {{ date | postDate }}</b>

## 👋 intro

Sending emails from containerized applications, such as a contact form within a PHP web application, can be challenging. While self-hosting my own web applications, I've discovered an elegant solution: setting up Postfix as a "send-only" SMTP server running on the host and connecting to it from the containers through Docker's virtual bridge network.

## 🧰 setup

This tutorial assumes that you are running a server on Ubuntu 22.04 and have Docker installed. For this tutorial to work, you need to have a domain pointing to your server and have it set up as the hostname.

### 🛠️ Install Postfix

First we will install Postfix:

{{ code.snippet('
sudo apt install mailutils
') }}

In the configuration window, choose <b>Internet Site</b>. Enter your hostname as the system mail name.


## 🍳 Postfix configuration

Open the configuration file:

{{ code.snippet('
sudo nano /etc/postfix/main.cf
') }}

The configuration option <b>inet_interfaces</b> specifies the network interface addresses from which this server receives mail. In this case, since we only want to send emails from this server, we set the option to <b>loopback_only</b>.

{{ code.snippet('
inet_interfaces = loopback-only
') }}

Since we want to receive connections from Docker containers, we need to specify the possible IP ranges in the <b>mynetworks</b> setting.

On my server, all Docker containers are in the same bridge network. The host's IP address in the network is <b>172.17.0.1</b>. To allow connections from all Docker containers, I edited the setting to:

{{ code.snippet('
mynetworks = 172.17.0.0/24 127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128
') }}

Now, if you connect from the Docker containers to the 25 port on the host (172.17.0.1), you should be able to send emails through the Postfix server.

### 🔐 encryption

Since we do not receive any mails, there's no need to configure any certificate. All we have to do is configure Postfix to use outbound TLS.

The best practice for this is to use opportunistic <b>DANE</b>. At this security level, the TLS policy for the destination is obtained via DNSSEC. If the TLSA records are not found or unusable, this setting reverts back to <b>encrypt</b>.

Set these settings in the 'main.cfg' file. You can delete all the other TLS settings.

{{ code.snippet('
smtp_tls_session_cache_database = btree:${data_directory}/smtp_scache
smtp_tls_security_level = dane
smtp_dns_support_level = dnssec
') }}

Restart the Postfix service to apply the configuration changes:

{{ code.snippet('
sudo systemctl restart postfix.service
') }}

## 🎉 success

All emails should now be TLS encrypted. To verify, you can view the source of the received email.