import DbService, { Message, Thread } from "../../db/dbService";
import { v4 as uuidv4 } from "uuid";

async function main() {
  const db = new DbService();
  await db.initialize();

  try {
    const title = process.argv[2] || "Sample Thread";

    // Create or get thread
    const thread: Thread = await db.getOrCreateThread(title);

    const thread_id = thread.id;

    // Seed messages
    const messages: Omit<Message, "created_at" | "updated_at" | "_id">[] = [
      {
        thread_id,
        role: "user",
        parts: [
          {
            text: "What does a nutritionist do?",
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            text: "I will research what a nutritionist does and then explain it to you.",
          },
          {
            text: "",
          },
          {
            functionCall: {
              args: {
                action: "create_list",
                description: "Research the role of a nutritionist.",
                todos: [
                  {
                    name: "Research the definition and duties of a nutritionist.",
                  },
                  {
                    name: "Synthesize the information and answer the user.",
                  },
                  {
                    name: "Follow up with the user.",
                  },
                ],
                name: "Nutritionist Role Research",
              },
              name: "todo_list",
              id: "df46562c-70ea-41cb-bebb-06c176aa84d4",
            },
          },
          {
            functionResponse: {
              name: "todo_list",
              id: "df46562c-70ea-41cb-bebb-06c176aa84d4",
              response: {
                output: [
                  {
                    id: "79af581a-c5d2-45af-b64d-a3f9df4c2a3f",
                    thread_id,
                    name: "Nutritionist Role Research",
                    description: "Research the role of a nutritionist.",
                    created_at: "2025-09-29T11:53:44.725Z",
                    updated_at: "2025-09-29T11:53:44.725Z",
                    todos: [
                      {
                        id: "5155861a-0e56-4745-9bf3-7dc75ca9c8c2",
                        todo_list_id: "79af581a-c5d2-45af-b64d-a3f9df4c2a3f",
                        name: "Research the definition and duties of a nutritionist.",
                        status: "queue",
                        created_at: "2025-09-29T11:53:44.733Z",
                        updated_at: "2025-09-29T11:53:44.733Z",
                      },
                      {
                        id: "0229a1b8-b91b-4e23-98b7-d325832fd79a",
                        todo_list_id: "79af581a-c5d2-45af-b64d-a3f9df4c2a3f",
                        name: "Synthesize the information and answer the user.",
                        status: "queue",
                        created_at: "2025-09-29T11:53:44.736Z",
                        updated_at: "2025-09-29T11:53:44.736Z",
                      },
                      {
                        id: "81ab65c8-0292-45ec-942d-86e9783ba66c",
                        todo_list_id: "79af581a-c5d2-45af-b64d-a3f9df4c2a3f",
                        name: "Follow up with the user.",
                        status: "queue",
                        created_at: "2025-09-29T11:53:44.738Z",
                        updated_at: "2025-09-29T11:53:44.738Z",
                      },
                    ],
                  },
                ],
                error: null,
              },
            },
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            text: "I will start by researching the definition and duties of a nutritionist.",
          },
          {
            text: "",
          },
          {
            functionCall: {
              args: {
                query: "what does a nutritionist do",
              },
              name: "search_web",
              id: "529c0649-6766-46e2-a774-568a9d390225",
            },
          },
          {
            functionResponse: {
              name: "search_web",
              id: "529c0649-6766-46e2-a774-568a9d390225",
              response: {
                output: [
                  {
                    title:
                      "What Does a Nutritionist Do?| University of Bridgeport",
                    url: "https://www.bridgeport.edu/news/what-does-a-nutritionist-do/",
                    description:
                      "<strong>Nutritionists</strong> help clients make informed decisions about food, exercise, and general health. Learn what <strong>a</strong> <strong>nutritionist</strong> <strong>does</strong> on a daily basis.",
                    profile: {
                      name: "University of Bridgeport",
                      url: "https://www.bridgeport.edu/news/what-does-a-nutritionist-do/",
                      long_name: "bridgeport.edu",
                      img: "https://imgs.search.brave.com/n5WsAY3O687vPzlueaTl26zdtWhh2SS8bGnZDAZxBCM/rs:fit:32:32:1:0/g:ce/aHR0cDovL2Zhdmlj/b25zLnNlYXJjaC5i/cmF2ZS5jb20vaWNv/bnMvYzU0MjcxYTFi/OTFlY2M1MTc0NWU5/Mzg0ZmVkOWJhZGU3/OWZjMmE2NzFiNmVh/NGVhNTdiYWVlOTcx/YTMzMThkOC93d3cu/YnJpZGdlcG9ydC5l/ZHUv",
                    },
                  },
                  {
                    title:
                      "What Does a Nutritionist Do? (Job Duties & Workplaces)",
                    url: "https://www.allalliedhealthschools.com/nutritionist/nutritionist-careers/",
                    description:
                      "<strong>Nutritionists</strong> help people achieve their health and wellness goals by creating plans tailored to each client and educating them about nutrition.",
                    profile: {
                      name: "Allied Health Schools",
                      url: "https://www.allalliedhealthschools.com/nutritionist/nutritionist-careers/",
                      long_name: "allalliedhealthschools.com",
                      img: "https://imgs.search.brave.com/DcSAstS5BOAvVX1DEzqe3QLsbYbzI0xYxncJEduAj1c/rs:fit:32:32:1:0/g:ce/aHR0cDovL2Zhdmlj/b25zLnNlYXJjaC5i/cmF2ZS5jb20vaWNv/bnMvMzFlNGM0OTky/YTJhNGYxZmEwY2Q2/ZWM4MTQ5OTM4MDgx/ZWY3Mjk5ZWZiYTA1/YTU5YmRmZDY1YTE5/ODE3MzJlYS93d3cu/YWxsYWxsaWVkaGVh/bHRoc2Nob29scy5j/b20v",
                    },
                  },
                  {
                    title:
                      "Dietitians and Nutritionists: What’s the Difference? - GoodRx",
                    url: "https://www.goodrx.com/well-being/diet-nutrition/dietitian-vs-nutritionist",
                    description:
                      "Do you need a dietitian or <strong>a</strong> <strong>nutritionist</strong>? Here’s the difference between them, including cost and training.",
                    profile: {
                      name: "GoodRx",
                      url: "https://www.goodrx.com/well-being/diet-nutrition/dietitian-vs-nutritionist",
                      long_name: "goodrx.com",
                      img: "https://imgs.search.brave.com/TluGaMLKTqLhWNZHeVjXKR_hT4W5te0zBPCqhGrW9Cg/rs:fit:32:32:1:0/g:ce/aHR0cDovL2Zhdmlj/b25zLnNlYXJjaC5i/cmF2ZS5jb20vaWNv/bnMvMDhiY2JiY2M0/OTY2MGE3NmRhNjM4/NGNkZTQ3YjVhYWY2/ZTkyYjVjYTZlNWRh/ZjJmNWY2NTJjNTU4/NWRkNzBlNi93d3cu/Z29vZHJ4LmNvbS8",
                    },
                  },
                  {
                    title:
                      "Dietitians and Nutritionists : Occupational Outlook Handbook: : U.S. Bureau of Labor Statistics",
                    url: "https://www.bls.gov/ooh/healthcare/dietitians-and-nutritionists.htm",
                    description:
                      "In order to maintain the RDN credential, dietitians and <strong>nutritionists</strong> must complete continuing professional education credits within a designated number of years.  · Many states accept the Certified Nutrition Specialist (CNS) credential or exam for licensure purposes. To qualify for the credential, applicants must have a master’s or doctoral ...",
                    profile: {
                      name: "U.S. Bureau of Labor Statistics",
                      url: "https://www.bls.gov/ooh/healthcare/dietitians-and-nutritionists.htm",
                      long_name: "bls.gov",
                      img: "https://imgs.search.brave.com/Rbwrp0tPXlKCmo2pP2FlwTXo4AXQ-DmoKZaOK-pJX38/rs:fit:32:32:1:0/g:ce/aHR0cDovL2Zhdmlj/b25zLnNlYXJjaC5i/cmF2ZS5jb20vaWNv/bnMvYTA2NzhhOTRh/ZTM0NGZjZGNkODE3/NjdlOGZkZjI0YWJm/NzMyMjc5NzFkNGJl/YTZjNjQ0MTUzM2U4/Zjk0NzIwZC93d3cu/YmxzLmdvdi8",
                    },
                  },
                  {
                    title:
                      "What Is a Nutritionist? | Faculty Spotlight | UCLA Medical School",
                    url: "https://medschool.ucla.edu/news-article/what-is-a-nutritionist",
                    description:
                      "Surampudi says her favorite part of being <strong>a</strong> <strong>nutritionist</strong> is helping people take control of their health through lifestyle choices. National Nutrition Month® takes place in March. The Academy of Nutrition and Dietetics created it to educate people about healthy eating and lifestyle choices and to empower them to make positive changes. ... UCLA medical student Jose Segura-Bermudez is becoming a doctor ...",
                    profile: {
                      name: "UCLA Medical School",
                      url: "https://medschool.ucla.edu/news-article/what-is-a-nutritionist",
                      long_name: "medschool.ucla.edu",
                      img: "https://imgs.search.brave.com/Hf7A5qDEde56g3u4KXgr6JIiE2UQFbtNN-qix6D5Ssc/rs:fit:32:32:1:0/g:ce/aHR0cDovL2Zhdmlj/b25zLnNlYXJjaC5i/cmF2ZS5jb20vaWNv/bnMvNDU3MjQ5M2Yy/YWM0YzllYTZhZTQ2/MWY2ZTYyMWY1MDM1/NGQ3ZWNiYmNlYjJi/ODc2YmM3NTUxY2I0/M2VkM2Q0Ny9tZWRz/Y2hvb2wudWNsYS5l/ZHUv",
                    },
                  },
                ],
                error: null,
              },
            },
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            text: "A nutritionist is a health professional who advises people on how to eat healthily and achieve their health goals. They assess their clients' dietary needs and create personalized nutrition plans. Nutritionists also educate people about the importance of good nutrition and how it can impact their overall health and well-being. They may work in a variety of settings, including hospitals, clinics, schools, and private practices.",
          },
          {
            text: "",
          },
          {
            functionCall: {
              args: {
                todo: {
                  status: "completed",
                  id: "5155861a-0e56-4745-9bf3-7dc75ca9c8c2",
                  name: "Research the definition and duties of a nutritionist.",
                },
                action: "mark_as_completed",
                todo_list_id: "79af581a-c5d2-45af-b64d-a3f9df4c2a3f",
              },
              name: "todo_list",
              id: "06d4d8d1-c6f3-4723-bd18-fa2049311cff",
            },
          },
          {
            functionResponse: {
              name: "todo_list",
              id: "06d4d8d1-c6f3-4723-bd18-fa2049311cff",
              response: {
                output: [
                  {
                    id: "79af581a-c5d2-45af-b64d-a3f9df4c2a3f",
                    thread_id,
                    name: "Nutritionist Role Research",
                    description: "Research the role of a nutritionist.",
                    created_at: "2025-09-29T11:53:44.725Z",
                    updated_at: "2025-09-29T11:53:44.725Z",
                    todos: [
                      {
                        id: "5155861a-0e56-4745-9bf3-7dc75ca9c8c2",
                        todo_list_id: "79af581a-c5d2-45af-b64d-a3f9df4c2a3f",
                        name: "Research the definition and duties of a nutritionist.",
                        status: "completed",
                        created_at: "2025-09-29T11:53:44.733Z",
                        updated_at: "2025-09-29T11:54:01.617Z",
                      },
                      {
                        id: "0229a1b8-b91b-4e23-98b7-d325832fd79a",
                        todo_list_id: "79af581a-c5d2-45af-b64d-a3f9df4c2a3f",
                        name: "Synthesize the information and answer the user.",
                        status: "queue",
                        created_at: "2025-09-29T11:53:44.736Z",
                        updated_at: "2025-09-29T11:53:44.736Z",
                      },
                      {
                        id: "81ab65c8-0292-45ec-942d-86e9783ba66c",
                        todo_list_id: "79af581a-c5d2-45af-b64d-a3f9df4c2a3f",
                        name: "Follow up with the user.",
                        status: "queue",
                        created_at: "2025-09-29T11:53:44.738Z",
                        updated_at: "2025-09-29T11:53:44.738Z",
                      },
                    ],
                  },
                ],
                error: null,
              },
            },
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            text: "I will now synthesize the information and answer your question.\n\nA nutritionist is a professional who advises on matters of food and nutritional impacts on health. Different professional terms, such as dietitian, are used in different countries and professional settings. \n\nSome of the main responsibilities of a nutritionist include:\n\n- **Assessing clients' nutritional needs:** This involves analyzing their diet, lifestyle, and health goals.\n- **Developing personalized nutrition plans:** These plans are tailored to meet the specific needs and goals of each client.\n- **Educating clients about nutrition:** This includes teaching them about healthy eating habits, portion control, and the importance of a balanced diet.\n- **Monitoring clients' progress:** This helps to ensure that they are on track to achieving their health goals.\n- **Providing support and motivation:** This can help clients to stay on track and make lasting lifestyle changes.",
          },
          {
            text: "",
          },
          {
            functionCall: {
              args: {
                action: "mark_as_completed",
                todo_list_id: "79af581a-c5d2-45af-b64d-a3f9df4c2a3f",
                todo: {
                  status: "completed",
                  name: "Synthesize the information and answer the user.",
                  id: "0229a1b8-b91b-4e23-98b7-d325832fd79a",
                },
              },
              name: "todo_list",
              id: "552f2bfa-71dc-4b4f-8b1c-89d25e681cf0",
            },
          },
          {
            functionResponse: {
              name: "todo_list",
              id: "552f2bfa-71dc-4b4f-8b1c-89d25e681cf0",
              response: {
                output: [
                  {
                    id: "79af581a-c5d2-45af-b64d-a3f9df4c2a3f",
                    thread_id,
                    name: "Nutritionist Role Research",
                    description: "Research the role of a nutritionist.",
                    created_at: "2025-09-29T11:53:44.725Z",
                    updated_at: "2025-09-29T11:53:44.725Z",
                    todos: [
                      {
                        id: "5155861a-0e56-4745-9bf3-7dc75ca9c8c2",
                        todo_list_id: "79af581a-c5d2-45af-b64d-a3f9df4c2a3f",
                        name: "Research the definition and duties of a nutritionist.",
                        status: "completed",
                        created_at: "2025-09-29T11:53:44.733Z",
                        updated_at: "2025-09-29T11:54:01.617Z",
                      },
                      {
                        id: "0229a1b8-b91b-4e23-98b7-d325832fd79a",
                        todo_list_id: "79af581a-c5d2-45af-b64d-a3f9df4c2a3f",
                        name: "Synthesize the information and answer the user.",
                        status: "completed",
                        created_at: "2025-09-29T11:53:44.736Z",
                        updated_at: "2025-09-29T11:54:08.590Z",
                      },
                      {
                        id: "81ab65c8-0292-45ec-942d-86e9783ba66c",
                        todo_list_id: "79af581a-c5d2-45af-b64d-a3f9df4c2a3f",
                        name: "Follow up with the user.",
                        status: "queue",
                        created_at: "2025-09-29T11:53:44.738Z",
                        updated_at: "2025-09-29T11:53:44.738Z",
                      },
                    ],
                  },
                ],
                error: null,
              },
            },
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            text: "Do you have any other questions?",
          },
          {
            text: "",
          },
          {
            functionCall: {
              args: {
                todo_list_id: "79af581a-c5d2-45af-b64d-a3f9df4c2a3f",
                action: "mark_as_completed",
                todo: {
                  id: "81ab65c8-0292-45ec-942d-86e9783ba66c",
                  status: "completed",
                  name: "Follow up with the user.",
                },
              },
              name: "todo_list",
              id: "beb3f08e-336d-4621-8dc4-7efc5d841857",
            },
          },
          {
            functionResponse: {
              name: "todo_list",
              id: "beb3f08e-336d-4621-8dc4-7efc5d841857",
              response: {
                output: [
                  {
                    id: "79af581a-c5d2-45af-b64d-a3f9df4c2a3f",
                    thread_id,
                    name: "Nutritionist Role Research",
                    description: "Research the role of a nutritionist.",
                    created_at: "2025-09-29T11:53:44.725Z",
                    updated_at: "2025-09-29T11:53:44.725Z",
                    todos: [
                      {
                        id: "5155861a-0e56-4745-9bf3-7dc75ca9c8c2",
                        todo_list_id: "79af581a-c5d2-45af-b64d-a3f9df4c2a3f",
                        name: "Research the definition and duties of a nutritionist.",
                        status: "completed",
                        created_at: "2025-09-29T11:53:44.733Z",
                        updated_at: "2025-09-29T11:54:01.617Z",
                      },
                      {
                        id: "0229a1b8-b91b-4e23-98b7-d325832fd79a",
                        todo_list_id: "79af581a-c5d2-45af-b64d-a3f9df4c2a3f",
                        name: "Synthesize the information and answer the user.",
                        status: "completed",
                        created_at: "2025-09-29T11:53:44.736Z",
                        updated_at: "2025-09-29T11:54:08.590Z",
                      },
                      {
                        id: "81ab65c8-0292-45ec-942d-86e9783ba66c",
                        todo_list_id: "79af581a-c5d2-45af-b64d-a3f9df4c2a3f",
                        name: "Follow up with the user.",
                        status: "completed",
                        created_at: "2025-09-29T11:53:44.738Z",
                        updated_at: "2025-09-29T11:54:15.649Z",
                      },
                    ],
                  },
                ],
                error: null,
              },
            },
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            text: 'It\'s also worth noting the difference between a nutritionist and a registered dietitian (RD) or registered dietitian nutritionist (RDN).\n\nWhile both provide nutrition advice, the term "dietitian" is legally protected in many places, meaning individuals must meet specific educational and professional requirements, such as completing an accredited degree, a supervised practice program, and passing a national exam.\n\nThe term "nutritionist" is less regulated and can sometimes be used by individuals with varied levels of education and training. However, some nutritionists hold advanced degrees and certifications, like the Certified Nutrition Specialist (CNS).\n\nWould you like to know more about their specific qualifications or anything else?',
          },
          {
            text: "",
          },
        ],
      },
      {
        thread_id,
        role: "user",
        parts: [
          {
            text: "That's really interesting. What are the specific qualifications for a Registered Dietitian (RD) in the US?",
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            text: "I can certainly look up the current requirements for becoming a Registered Dietitian in the US for you.",
          },
          {
            functionCall: {
              args: {
                query: "qualifications for registered dietitian in the US",
              },
              name: "search_web",
              id: "1e5c3b4a-8d21-4f69-9c58-4a7b0f2c3d4e_call1",
            },
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            functionResponse: {
              name: "search_web",
              id: "1e5c3b4a-8d21-4f69-9c58-4a7b0f2c3d4e_call1",
              response: {
                output: [
                  {
                    title:
                      "Steps to Become a Registered Dietitian Nutritionist (RDN) - Academy of Nutrition and Dietetics",
                    url: "https://www.eatright.org/become-an-rdn-or-dtr/dietetics-career-path",
                    description:
                      "The path to becoming a Registered Dietitian Nutritionist (RDN) includes education, supervised practice, and passing the national examination.",
                    profile: {
                      name: "Academy of Nutrition and Dietetics",
                      url: "https://www.eatright.org/",
                      long_name: "eatright.org",
                    },
                  },
                  {
                    title:
                      "Registered Dietitian vs. Nutritionist: What’s the Difference?",
                    url: "https://www.healthline.com/nutrition/dietitian-vs-nutritionist",
                    description:
                      "A Registered Dietitian has specific, advanced education and training requirements, including a minimum of a bachelor's degree and a supervised internship.",
                    profile: {
                      name: "Healthline",
                      url: "https://www.healthline.com/",
                      long_name: "healthline.com",
                    },
                  },
                ],
                error: null,
              },
            },
          },
          {
            text: "To become a **Registered Dietitian (RD)** or **Registered Dietitian Nutritionist (RDN)** in the US, you generally need to complete the following steps:",
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            text: "- **Education:** Complete a minimum of a bachelor's degree at a U.S. regionally accredited university or college and complete coursework accredited or approved by the Accreditation Council for Education in Nutrition and Dietetics (ACEND) of the Academy of Nutrition and Dietetics. **Note:** Starting January 1, 2024, a master's degree will be the minimum degree requirement.\n- **Supervised Practice:** Complete an ACEND-accredited supervised practice program (dietetic internship) of at least **1,200 hours**.\n- **Examination:** Pass a national examination administered by the Commission on Dietetic Registration (CDR).\n- **Licensure:** Obtain licensure or certification in your state of practice, as many states require it.",
          },
        ],
      },
      {
        thread_id,
        role: "user",
        parts: [
          {
            text: "Wow, 1,200 hours of supervised practice is a lot! What kind of places do these dietetic internships take place?",
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            text: "That's a great question. The supervised practice, or **dietetic internship**, is designed to give a wide range of hands-on experience. Internships typically include rotations in various settings, such as:\n\n1.  **Clinical Nutrition:** Hospitals and long-term care facilities, focusing on medical nutrition therapy.\n2.  **Foodservice Management:** Schools, corporate cafeterias, or hospitals, dealing with large-scale food production and management.\n3.  **Community Nutrition:** Public health agencies, WIC programs, or non-profit organizations, providing education to the public.\n4.  **Specialty/Elective Rotations:** These can vary but might include private practice, sports nutrition, research, or wellness centers.",
          },
        ],
      },
      {
        thread_id,
        role: "user",
        parts: [
          {
            text: "It sounds like a very comprehensive training. How does that compare to the Certified Nutrition Specialist (CNS) designation you mentioned earlier for nutritionists?",
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            text: "The **Certified Nutrition Specialist (CNS)** is a credential that has a different focus, often leaning more towards personalized nutrition and functional medicine. I'll search for its requirements to give you a clear comparison.",
          },
          {
            functionCall: {
              args: {
                query: "Certified Nutrition Specialist CNS requirements",
              },
              name: "search_web",
              id: "5s6t7u8v-9w0x-1y2z-3a4b-5c6d7e8f9g0h_call1",
            },
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            functionResponse: {
              name: "search_web",
              id: "5s6t7u8v-9w0x-1y2z-3a4b-5c6d7e8f9g0h_call1",
              response: {
                output: [
                  {
                    title: "CNS Certification Requirements - BCNS",
                    url: "https://nutritionspecialists.org/cnscertification",
                    description:
                      "The CNS certification is for advanced personalized nutrition practitioners. Requirements include a master's or doctoral degree and a significant amount of supervised practice.",
                    profile: {
                      name: "Board for Certification of Nutrition Specialists (BCNS)",
                      url: "https://nutritionspecialists.org/",
                      long_name: "nutritionspecialists.org",
                    },
                  },
                ],
                error: null,
              },
            },
          },
          {
            text: "Here are the main requirements for the **Certified Nutrition Specialist (CNS)** certification, as credentialed by the Board for Certification of Nutrition Specialists (BCNS):\n\n- **Education:** A master's or doctoral degree in nutrition or a related field from a regionally accredited institution.\n- **Experience:** 1,000 hours of supervised practice experience in personalized nutrition.\n- **Examination:** Passing the rigorous CNS certification exam.\n\nSo, while the RD requires a specific type of supervised practice (dietetic internship) often focused on clinical, food service, and community, the CNS requires an advanced degree (Master's or Doctorate) and supervised practice specifically in **personalized nutrition**.",
          },
        ],
      },
      {
        thread_id,
        role: "user",
        parts: [
          {
            text: "I see. So, an RD is often associated with a broader, more clinical/public health role, and a CNS with more advanced, individualized approaches. Which designation is generally considered better for someone with a chronic illness looking for dietary advice?",
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            text: "For someone with a **chronic illness** looking for medical dietary advice, a **Registered Dietitian (RD/RDN)** is generally the primary recommendation. \n\n### Why the RD/RDN is often preferred for Chronic Illness:\n\n* **Medical Nutrition Therapy (MNT):** RDs are trained and legally authorized in most settings to provide **Medical Nutrition Therapy**, which is the clinical practice of treating chronic conditions (like diabetes, heart disease, kidney disease) through a tailored diet.\n* **Integration with Healthcare:** RDs often work directly in hospitals, clinics, and doctor's offices, making them integrated into the standard healthcare system. Their services are also more likely to be covered by insurance when a diagnosis is present.\n\n### The CNS Role:\n\n* A CNS is also qualified, especially one with extensive clinical experience, and their focus on **personalized nutrition** can be highly beneficial for complex or multi-system chronic issues.\n\nThe best choice ultimately depends on the specific illness, the individual's needs, and the practitioner's experience and specialization.",
          },
        ],
      },
      {
        thread_id,
        role: "user",
        parts: [
          {
            text: "That makes sense regarding MNT and insurance. What if I wanted to find a nutritionist specializing in sports performance and athletic training—would an RD or CNS be more likely to have that specialization?",
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            text: "For **sports performance and athletic training**, you'll most often encounter RDs who hold an advanced certification, the **Board Certified Specialist in Sports Dietetics (CSSD)**. I'll search for this to confirm the primary credential for sports nutrition specialists.",
          },
          {
            functionCall: {
              args: {
                query: "primary certification for sports nutritionist",
              },
              name: "search_web",
              id: "5u6v7w8x-9y0z-1a2b-3c4d-5e6f7g8h9i0j_call1",
            },
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            functionResponse: {
              name: "search_web",
              id: "5u6v7w8x-9y0z-1a2b-3c4d-5e6f7g8h9i0j_call1",
              response: {
                output: [
                  {
                    title:
                      "What Is a CSSD? - Commission on Dietetic Registration",
                    url: "https://www.cdrnet.org/certifications/cssd",
                    description:
                      "The CSSD is the premier professional credential for sports dietitians.",
                    profile: {
                      name: "Commission on Dietetic Registration (CDR)",
                      url: "https://www.cdrnet.org/",
                      long_name: "cdrnet.org",
                    },
                  },
                ],
                error: null,
              },
            },
          },
          {
            text: "You are correct that the RD is the foundation for the most recognized advanced certification in this field. The gold standard for sports performance nutrition is the **Board Certified Specialist in Sports Dietetics (CSSD)**, which is only available to Registered Dietitians (RDs).\n\n* **CSSD Requirements:** Requires a minimum of 2,000 hours of practice in sports nutrition and a specialty exam.\n\nWhile a CNS or a regular nutritionist may also specialize in sports, the CSSD is the credential specifically designed for the advanced practice of sports nutrition within the clinical, community, and performance setting.",
          },
        ],
      },
      {
        thread_id,
        role: "user",
        parts: [
          {
            text: "Got it. So if I'm building an agent to help people find nutrition help, I should prioritize filtering by RD or CNS, and then look for specialty certifications like CSSD?",
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            text: "That's an excellent approach for your agent. Here's a suggested logic:\n\n1.  **Primary Filter (Highest Credential/Regulation):** Filter for **RD/RDN** (Registered Dietitian/Registered Dietitian Nutritionist) or **CNS** (Certified Nutrition Specialist).\n    * *RD/RDN* is key for medically complex or insurance-covered needs.\n    * *CNS* is key for complex, personalized, and functional nutrition needs (requires a master's degree).\n2.  **Secondary Filter (Specialty/Focus):** Apply secondary filters based on the user's specific need (e.g., chronic illness, sports, pediatrics, weight management).\n    * For RDs, look for **CDR Board Certifications** like **CSSD** (Sports), **CSO** (Oncology), **CSP** (Pediatrics), etc.\n    * For CNS, you would look at their clinical experience and functional medicine training.\n\nThis two-step process ensures both a solid educational foundation and relevant specialization.",
          },
        ],
      },
      {
        thread_id,
        role: "user",
        parts: [
          {
            text: "Perfect. What about state licensure? Do both RDs and CNSs need state licensure to practice?",
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            text: "I'll check the current status of state licensure for both RDs and CNSs in the US, as regulations can vary significantly by state.",
          },
          {
            functionCall: {
              args: {
                query: "state licensure for RD and CNS in US",
              },
              name: "search_web",
              id: "5w6x7y8z-9a0b-1c2d-3e4f-5g6h7i8j9k0l_call1",
            },
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            functionResponse: {
              name: "search_web",
              id: "5w6x7y8z-9a0b-1c2d-3e4f-5g6h7i8j9k0l_call1",
              response: {
                output: [
                  {
                    title:
                      "State Licensure - Academy of Nutrition and Dietetics",
                    url: "https://www.eatrightpro.org/advocacy/licensure/state-licensure-information",
                    description:
                      "Information on licensure, certification, or registration for RDNs by state.",
                    profile: {
                      name: "Academy of Nutrition and Dietetics",
                      url: "https://www.eatrightpro.org/",
                      long_name: "eatrightpro.org",
                    },
                  },
                  {
                    title: "CNS Licensure by State - BCNS",
                    url: "https://nutritionspecialists.org/state-licensure-info",
                    description:
                      "List of states that recognize the CNS certification for licensure to practice nutrition.",
                    profile: {
                      name: "Board for Certification of Nutrition Specialists (BCNS)",
                      url: "https://nutritionspecialists.org/",
                      long_name: "nutritionspecialists.org",
                    },
                  },
                ],
                error: null,
              },
            },
          },
          {
            text: "State licensure is complex and varies by location, but here's the general overview:\n\n* **Registered Dietitians (RDs/RDNs):** The majority of U.S. states have a statutory law (licensure, certification, or registration) for dietetics practice. Being an RD is typically the primary path to meeting these state requirements, as the national CDR exam is usually recognized by state boards.\n\n* **Certified Nutrition Specialists (CNSs):** A growing number of states legally recognize the CNS credential as a path to licensure or certification to practice nutrition. However, this is not universal, and in some states, a CNS may be limited in what they can legally call themselves or what type of advice they can provide (especially **Medical Nutrition Therapy**). \n\n**Key Takeaway for your agent:** Your agent should definitely prompt the user for their state, and you should use a database to ensure the recommended professional can legally practice MNT in that specific location, especially if they are a CNS or non-credentialed nutritionist.",
          },
        ],
      },
      {
        thread_id,
        role: "user",
        parts: [
          {
            text: "That is a critical point! What would be a good follow-up question to ask the user to get the necessary location information?",
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            text: 'A clear, direct question is best. You can combine the need for a location with a quick check on their general goal, which will help narrow down the specialist type. \n\nI suggest a two-part question to streamline the next step:\n\n**"To ensure I recommend a professional who is legally authorized to help you, in which state do you plan to receive nutrition guidance, and what is the main health goal you\'re seeking advice for (e.g., managing diabetes, improving athletic performance, general wellness)?"**',
          },
        ],
      },
      {
        thread_id,
        role: "user",
        parts: [
          {
            text: "My state is Texas, and I'm looking for help with pre-diabetes management.",
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            text: "That is a medical condition, so I will now focus my search on professionals legally able to provide Medical Nutrition Therapy (MNT) in Texas. I'll search for Texas licensure for RDs and CNSs related to pre-diabetes to ensure accuracy.",
          },
          {
            functionCall: {
              args: {
                query:
                  "Texas licensure requirements for MNT pre-diabetes RD vs CNS",
              },
              name: "search_web",
              id: "5y6z7a8b-9c0d-1e2f-3g4h-5i6j7k8l9m0n_call1",
            },
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            functionResponse: {
              name: "search_web",
              id: "5y6z7a8b-9c0d-1e2f-3g4h-5i6j7k8l9m0n_call1",
              response: {
                output: [
                  {
                    title:
                      "Texas Health and Safety Code, Chapter 701, Subchapter C",
                    url: "https://www.statutes.legis.state.tx.us/Docs/HS/htm/HS.701.htm",
                    description:
                      "Texas has a specific licensing law for dietitians (Licensed Dietitian - LD), and practice without a license is generally prohibited.",
                    profile: {
                      name: "Texas Legislature Online",
                      url: "https://www.statutes.legis.state.tx.us/",
                      long_name: "statutes.legis.state.tx.us",
                    },
                  },
                  {
                    title: "Texas Statutes on the Practice of Nutrition",
                    url: "https://www.tdlr.texas.gov/dietitians/dietitians.htm",
                    description:
                      "The Texas Department of Licensing and Regulation (TDLR) regulates Licensed Dietitians (LD).",
                    profile: {
                      name: "Texas Department of Licensing and Regulation (TDLR)",
                      url: "https://www.tdlr.texas.gov/",
                      long_name: "tdlr.texas.gov",
                    },
                  },
                ],
              },
            },
          },
          {
            text: "Texas is a state with strong regulation for dietetics. In Texas, a professional must be a **Licensed Dietitian (LD)** to practice **Medical Nutrition Therapy (MNT)**, which includes managing conditions like pre-diabetes.\n\n* **RD to LD:** Nearly all individuals who are a Registered Dietitian (RD/RDN) are eligible and obtain a Texas state license (LD).\n* **CNS/Nutritionist:** Other nutrition titles are highly restricted from providing MNT unless they fall under specific exemptions. For pre-diabetes management, the simplest and safest recommendation is to search for a **Registered Dietitian** who is also a **Licensed Dietitian (LD)** in Texas.",
          },
        ],
      },
      {
        thread_id,
        role: "user",
        parts: [
          {
            text: "Great. What specialty certification should I look for on top of the RD/LD for the best help with pre-diabetes?",
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            text: "The most relevant advanced certification for pre-diabetes and diabetes management is the **Certified Diabetes Care and Education Specialist (CDCES)**. I'll check its details.",
          },
          {
            functionCall: {
              args: {
                query: "Certified Diabetes Care and Education Specialist CDCES",
              },
              name: "search_web",
              id: "3u4v5w6x-7y8z-9a0b-1c2d-3e4f5g6h7i8j_call1",
            },
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            functionResponse: {
              name: "search_web",
              id: "3u4v5w6x-7y8z-9a0b-1c2d-3e4f5g6h7i8j_call1",
              response: {
                output: [
                  {
                    title:
                      "What is a CDCES? - Certification Board for Diabetes Care and Education (CBDCE)",
                    url: "https://www.cbdce.org/certifications/cdces",
                    description:
                      "The CDCES certification is for health professionals who are specialists in diabetes care, education, and management.",
                    profile: {
                      name: "CBDCE",
                      url: "https://www.cbdce.org/",
                      long_name: "cbdce.org",
                    },
                  },
                ],
                error: null,
              },
            },
          },
          {
            text: "For the best support with **pre-diabetes management** in Texas, you should look for a **Registered Dietitian (RD) / Licensed Dietitian (LD)** who also holds the **Certified Diabetes Care and Education Specialist (CDCES)** credential.\n\n* **CDCES:** This certification demonstrates advanced knowledge and experience in the prevention, pre-diabetes, and management of diabetes and is highly recommended for your specific goal.",
          },
        ],
      },
      {
        thread_id,
        role: "user",
        parts: [
          {
            text: "Are there any other important factors an RD/LD with a CDCES might offer?",
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            text: "Yes, beyond their core knowledge, an RD/LD with a CDCES offers two significant advantages for pre-diabetes:\n\n1.  **Comprehensive Education:** A CDCES is trained to teach you not only *what* to eat but also how to monitor blood sugar, understand the impact of medication (if applicable), manage stress, and integrate physical activity, providing a holistic lifestyle change program.\n2.  **Referral Network:** Due to their clinical training and certification, they are typically well-connected with other healthcare providers (endocrinologists, primary care doctors) who manage diabetes, ensuring coordinated care.",
          },
        ],
      },
      {
        thread_id,
        role: "user",
        parts: [
          {
            text: "Can I search for a local Texas RD/LD, CDCES with my agent?",
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            text: "Yes, absolutely. The final step for your agent would be to use the detailed criteria you've established—**RD/LD** with **CDCES** in **Texas**—to query a professional directory. I can mock the final search query for you.",
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            text: "I will perform a mock search to demonstrate how this query would work.",
          },
          {
            functionCall: {
              args: {
                query: "Registered Dietitian Licensed Dietitian CDCES Texas",
              },
              name: "search_web",
              id: "9m0n1o2p-3q4r-5s6t-7u8v-9w0x1y2z3a4b_call1",
            },
          },
        ],
      },
      {
        thread_id,
        role: "model",
        parts: [
          {
            functionResponse: {
              name: "search_web",
              id: "9m0n1o2p-3q4r-5s6t-7u8v-9w0x1y2z3a4b_call1",
              response: {
                output: [
                  {
                    title:
                      "Find an Expert - Academy of Nutrition and Dietetics - Texas",
                    url: "https://www.eatright.org/find-an-expert?state=TX&specialty=diabetes",
                    description:
                      "Directory of RDs in Texas specializing in diabetes care.",
                    profile: {
                      name: "Academy of Nutrition and Dietetics",
                      url: "https://www.eatright.org/",
                      long_name: "eatright.org",
                    },
                  },
                ],
                error: null,
              },
            },
          },
          {
            text: "The search mock confirms that directories like the Academy of Nutrition and Dietetics allow you to filter by location and specialization (like diabetes/pre-diabetes care). Your agent could then present the resulting list of qualified professionals to the user.\n\nDo you have any final questions about the different nutrition credentials or how to filter the best professional for a specific user need?",
          },
        ],
      },
    ];

    for (const m of messages) {
      await db.addMessage(m);
    }

    const saved = await db.getMessages(thread_id);
    console.log(
      JSON.stringify(
        {
          thread: thread_id,
          messages: saved,
        },
        null,
        2
      )
    );
  } finally {
    await db.close();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
