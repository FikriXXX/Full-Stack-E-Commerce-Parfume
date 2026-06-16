"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toggleUserRole } from "./actions";
import { toast } from "sonner";

interface RoleToggleProps {
  userId: string;
  initialRole: string;
}

export function RoleToggle({ userId, initialRole }: RoleToggleProps) {
  const router = useRouter();
  const [role, setRole] = useState(initialRole);
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async () => {
    setIsPending(true);
    const result = await toggleUserRole(userId, role);
    
    if (result.error) {
      toast.error(result.error);
    } else if (result.success && result.newRole) {
      setRole(result.newRole);
      toast.success(`Role updated to ${result.newRole}`);
      router.refresh();
    }
    
    setIsPending(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger disabled={isPending} className="focus:outline-none">
        <Badge 
          variant={role === "admin" ? "default" : "outline"}
          className={`cursor-pointer ${isPending ? "opacity-50" : "hover:opacity-80"}`}
        >
          {role}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleToggle}>
          Ubah ke {role === "admin" ? "user" : "admin"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
