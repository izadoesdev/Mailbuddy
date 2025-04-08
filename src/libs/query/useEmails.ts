"use client";

import { useQuery } from "@tanstack/react-query";
import { getEmails } from "@/app/test/actions/emails";

export function useEmails() {
  return useQuery({
    queryKey: ["emails"],
    queryFn: getEmails,
    refetchOnWindowFocus: false,
  });
} 