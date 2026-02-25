FROM eclipse-temurin:17-jdk

EXPOSE 8055

ADD target/corresp-care-0.0.1-SNAPSHOT.jar application.jar

ENTRYPOINT ["java", "-jar", "/application.jar"]
