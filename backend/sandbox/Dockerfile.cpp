FROM gcc:13.2.0
# coreutils already present in debian-based gcc image (provides GNU timeout)
WORKDIR /sandbox
CMD ["sh"]
