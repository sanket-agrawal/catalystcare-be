package in.catalystcare.catalystcare_backend.common.util;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public class DateUtil {
    public static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static String format(LocalDate dateTime) {
        if(dateTime == null) {
            return null;
        }

        return dateTime.format(formatter);
    }

}
