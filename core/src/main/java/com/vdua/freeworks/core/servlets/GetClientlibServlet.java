/*
 *  Copyright 2015 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
package com.vdua.freeworks.core.servlets;

import com.day.cq.widget.ClientLibrary;
import com.day.cq.widget.HtmlLibraryManager;
import com.day.cq.widget.LibraryType;
import org.apache.felix.scr.annotations.*;
import org.apache.felix.scr.annotations.Properties;
import org.apache.felix.scr.annotations.sling.SlingServlet;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.apache.sling.commons.json.JSONArray;
import org.apache.sling.commons.json.JSONException;
import org.apache.sling.commons.json.JSONObject;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;
import java.util.*;

/**
 * Servlet that writes some sample content into the response. It is mounted for
 * all resources of a specific Sling resource type. The
 * {@link SlingSafeMethodsServlet} shall be used for HTTP methods that are
 * idempotent. For write operations use the {@link SlingAllMethodsServlet}.
 */
@SuppressWarnings("serial")
@Component(metatype = false)
@Service(Servlet.class)
@Properties({
        @Property(name = "sling.servlet.resourceTypes", value = "clientlibvisualizer/render"),
        @Property(name = "sling.servlet.extensions", value = "json"),
        @Property(name = "sling.servlet.methods", value = "GET"),
        @Property(name = "service.description", value = "Adaptive Form Component Info Provider")
})
public class GetClientlibServlet extends SlingSafeMethodsServlet {

    @Reference
    private HtmlLibraryManager libraryManager;

    @Override
    protected void doGet(final SlingHttpServletRequest req,
            final SlingHttpServletResponse resp) throws ServletException, IOException {
        String clientlib = req.getParameter("clientlib");
        Collection<ClientLibrary> libraries = libraryManager.getLibraries(new String[]{clientlib}, LibraryType.JS,
                true, true);
        JSONArray jsonArray = new JSONArray();
        try {
            for (ClientLibrary lib: libraries) {
                JSONObject clientlibObj = new JSONObject();
                clientlibObj.put("path", lib.getPath());
                JSONArray arr = new JSONArray(Arrays.asList(lib.getCategories()));
                clientlibObj.put("categories", arr);
                Map deps = lib.getDependencies(false);
                arr = new JSONArray();
                if (deps != null) {
                    Set<Map.Entry> entries = deps.entrySet();
                    Iterator<Map.Entry> iter = entries.iterator();
                    while(iter.hasNext()) {
                        Map.Entry entry = iter.next();
                        ClientLibrary deplib = (ClientLibrary) entry.getValue();
                        JSONObject depObj = new JSONObject();
                        depObj.put("path", deplib.getPath());
                        depObj.put("categories", new JSONArray(Arrays.asList(deplib.getCategories())));
                        arr.put(depObj);
                    }
                }
                clientlibObj.put("deps", arr);
                Map embeds = lib.getEmbedded(null);
                arr = new JSONArray();
                if (embeds != null) {
                    Set<Map.Entry> entries = embeds.entrySet();
                    Iterator<Map.Entry> iter = entries.iterator();
                    while(iter.hasNext()) {
                        Map.Entry entry = iter.next();
                        ClientLibrary deplib = (ClientLibrary) entry.getValue();
                        JSONObject depObj = new JSONObject();
                        depObj.put("path", deplib.getPath());
                        depObj.put("categories", new JSONArray(Arrays.asList(deplib.getCategories())));
                        arr.put(depObj);
                    }
                }
                clientlibObj.put("embeds", arr);
                jsonArray.put(clientlibObj);
            }
            resp.getWriter().write(jsonArray.toString());
        } catch (JSONException e) {
            throw new ServletException(e);
        }
    }
}
