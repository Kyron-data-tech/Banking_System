package com.kyrodatatech.banking.config.security.interceptor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class GatewayWebConfig implements WebMvcConfigurer {

    @Autowired
    private GatewayApiKeyInterceptor gatewayApiKeyInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(gatewayApiKeyInterceptor).addPathPatterns("/api/gateway/v1/**");
    }
}
