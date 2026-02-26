package com.autorepair.common.pii;

public class MaskingUtil {
    
    public static String maskPhone(String phoneE164) {
        if (phoneE164 == null || phoneE164.length() < 4) {
            return "***";
        }
        return "*******" + phoneE164.substring(phoneE164.length() - 2);
    }
    
    public static String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***@***.***";
        }
        
        String[] parts = email.split("@");
        String localPart = parts[0];
        String domainPart = parts[1];
        
        String maskedLocal = localPart.length() > 1 
            ? localPart.charAt(0) + "***" 
            : "***";
        
        String maskedDomain = domainPart.length() > 3
            ? domainPart.charAt(0) + "***." + domainPart.substring(domainPart.lastIndexOf('.') + 1)
            : "***";
        
        return maskedLocal + "@" + maskedDomain;
    }
    
    public static String maskUuid(String uuid) {
        if (uuid == null || uuid.length() < 8) {
            return "********";
        }
        return uuid.substring(0, 8) + "...";
    }
    
    public static String maskCardNumber(String cardNumber) {
        if (cardNumber == null || cardNumber.length() < 4) {
            return "****";
        }
        return "****-****-****-" + cardNumber.substring(cardNumber.length() - 4);
    }
    
    public static String redactSensitive(String text) {
        if (text == null) {
            return null;
        }
        return "[REDACTED]";
    }
}
